import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import Cart from '@/lib/models/Cart';

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth instanceof NextResponse) return auth;

    await connectToDatabase();
    const decoded = auth as any;
    const { productId, address, cardType } = await req.json();
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

    if (address && (!address.street || !address.city || !address.state || !address.zipCode)) {
      return NextResponse.json({ error: 'Complete address is required' }, { status: 400 });
    }

    const product: any = await Product.findById(productId).exec();
    if (!product || (product.isActive !== undefined && !product.isActive)) {
      return NextResponse.json({ error: 'Product not available' }, { status: 400 });
    }

    const userFull = await User.findById(decoded.userId);
    if (!userFull) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const userForOrder: any = await User.findById(decoded.userId).select('name email phone address').lean();
    const shippingAddress = {
      name: address?.name || userForOrder?.name || 'Customer',
      email: address?.email || userForOrder?.email || 'no-reply@example.com',
      phone: address?.phone || userForOrder?.phone || '0000000000',
      street: address?.street || (userForOrder?.address && userForOrder.address.street) || 'Not provided',
      city: address?.city || (userForOrder?.address && userForOrder.address.city) || 'Not provided',
      state: address?.state || (userForOrder?.address && userForOrder.address.state) || 'Not provided',
      zipCode: address?.zipCode || (userForOrder?.address && userForOrder.address.zipCode) || '000000',
      country: address?.country || (userForOrder?.address && userForOrder.address.country) || 'India'
    };

    if (cardType) {
      // Validate cardType range
      const CARD_TYPES = ['Opal', 'Pink Quartz', 'Emerald', 'Ruby', 'Sapphire'];
      if (!CARD_TYPES.includes(cardType)) {
        return NextResponse.json({ error: 'Invalid card type' }, { status: 400 });
      }

      const CARD_GIFT_RANGES: Record<string, { min: number; max: number }> = {
        'Opal': { min: 99, max: 399 },
        'Sapphire': { min: 399, max: 999 },
        'Emerald': { min: 999, max: 1499 },
        'Pink Quartz': { min: 1499, max: 2499 },
        'Ruby': { min: 2499, max: 3999 },
      };
      const range = CARD_GIFT_RANGES[cardType];
      if (product.price < range.min || product.price > range.max) {
        return NextResponse.json({ error: `Product price is out of range for ${cardType} gift` }, { status: 400 });
      }

      // Check available claims
      const totalCards = (userFull.loyaltyCards || []).filter((c: any) => c.cardType === cardType).length;
      const fulfilledCount = (userFull.giftHampers || []).filter((h: any) => h.cardType === cardType && h.status === 'fulfilled').length;
      const availableClaims = Math.floor(totalCards / 10) - fulfilledCount;

      if (availableClaims <= 0) {
        return NextResponse.json({ error: `No available claims for ${cardType} card tier` }, { status: 403 });
      }

      // Create free card-based gift order
      const order = new Order({
        user: decoded.userId,
        items: [{
          product: product._id,
          name: product.name,
          image: product.images?.[0] || '/placeholder-jewelry.jpg',
          quantity: 1,
          price: 0,
          isGift: true
        }],
        totalAmount: 0,
        shippingAddress,
        paymentMethod: 'razorpay',
        paymentStatus: 'paid',
        orderStatus: 'pending'
      });
      await order.save();

      // Decrement product stock
      try {
        if (product.stock !== undefined && product.stock > 0) {
          product.stock = product.stock - 1;
          await product.save();
        }
      } catch (err) {
        console.warn('Failed to update product stock for card gift claim', err);
      }

      // Update user's giftHampers (mark one pending as fulfilled, or create a fulfilled one)
      const pendingHamper = userFull.giftHampers.find((h: any) => h.cardType === cardType && h.status === 'pending');
      if (pendingHamper) {
        pendingHamper.status = 'fulfilled';
        pendingHamper.fulfilledAt = new Date();
      } else {
        userFull.giftHampers.push({
          cardType,
          status: 'fulfilled',
          awardedAt: new Date(),
          fulfilledAt: new Date()
        });
      }

      // Also record in claimedGifts so it appears in standard claim histories
      userFull.claimedGifts = userFull.claimedGifts || [];
      userFull.claimedGifts.push({
        product: product._id,
        price: product.price,
        claimedAt: new Date(),
        status: 'redeemed',
        redeemedAt: new Date()
      });
      await userFull.save();

      return NextResponse.json({ success: true, message: 'Card gift claimed', orderId: order._id, orderNumber: order.orderNumber });
    }

    // compute averageSpend and eligibility
    const pastOrders = await Order.find({ user: decoded.userId, paymentStatus: 'paid' });
    const totalSpend = pastOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const totalProductsPurchased = pastOrders.reduce((sum, order) => {
      return (
        sum + (order.items || []).reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0)
      );
    }, 0);
    const averageSpend = totalProductsPurchased > 0 ? totalSpend / totalProductsPurchased : 0;

    // Now compute eligibility since last claim: require >=10 products purchased since last claim
    const userDoc: any = await User.findById(decoded.userId).select('claimedGifts name email phone address').lean();
    const lastClaimDate = (userDoc?.claimedGifts || [])
      .filter((g: any) => g.status !== 'revoked')
      .map((g: any) => g.claimedAt)
      .filter(Boolean)
      .sort((a: Date, b: Date) => new Date(b).getTime() - new Date(a).getTime())[0] || null;

    const pastOrdersPaid = await Order.find({ user: decoded.userId, paymentStatus: 'paid' }).lean();
    const ordersSinceLastClaim = lastClaimDate
      ? pastOrdersPaid.filter((order: any) => new Date(order.createdAt) > new Date(lastClaimDate))
      : pastOrdersPaid;

    const totalProductsPurchasedSinceLastClaim = ordersSinceLastClaim.reduce((sum: number, order: any) => {
      return (
        sum + (order.items || []).reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0)
      );
    }, 0);

    const unlocked = totalProductsPurchasedSinceLastClaim >= 10;
    if (!unlocked) {
      return NextResponse.json({ error: 'Not eligible for gifts yet' }, { status: 403 });
    }

    const already = (userFull.claimedGifts || []).some((g: any) => String(g.product) === String(productId) && g.status === 'claimed');
    if (already) return NextResponse.json({ error: 'Already claimed' }, { status: 400 });

    const order = new Order({
      user: decoded.userId,
      items: [{
        product: product._id,
        name: product.name,
        image: product.images?.[0] || '/placeholder-jewelry.jpg',
        quantity: 1,
        price: 0,
        isGift: true
      }],
      totalAmount: 0,
      shippingAddress,
      paymentMethod: 'razorpay',
      paymentStatus: 'paid',
      orderStatus: 'pending'
    });

    await order.save();

    // decrement product stock
    try {
      product.stock = (product.stock || 1) - 1;
      await product.save();
    } catch (err) {
      // ignore stock update failures
      console.warn('Failed to update product stock for gift claim', err);
    }

    // mark user's claimed gift
    userFull.claimedGifts = userFull.claimedGifts || [];
    userFull.claimedGifts.push({ product: product._id, price: product.price, claimedAt: new Date(), status: 'redeemed', redeemedAt: new Date() });
    await userFull.save();

    return NextResponse.json({ success: true, message: 'Gift claimed', orderId: order._id, orderNumber: order.orderNumber });
  } catch (error) {
    console.error('Error claiming gift:', error);
    return NextResponse.json({ error: 'Failed to claim gift' }, { status: 500 });
  }
}
