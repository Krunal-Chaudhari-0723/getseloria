import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { authMiddleware } from '@/lib/auth';
import User from '@/lib/models/User';
import Cart from '@/lib/models/Cart';

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth instanceof NextResponse) return auth;
    
    await connectToDatabase();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      order_id 
    } = await req.json();

    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpayKeySecret) {
      return NextResponse.json(
        { error: 'Razorpay is not configured. Set RAZORPAY_KEY_SECRET.' },
        { status: 500 }
      );
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(body)
      .digest('hex');

    const isVerified = expectedSignature === razorpay_signature;

    if (!isVerified) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Update order
    const order = await Order.findById(order_id);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    order.paymentStatus = 'paid';
    order.orderStatus = 'processing';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.paidAt = new Date();
    order.createdAt = new Date();
    await order.save();

    // Update product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }

    // If the order contained any gift items (marked by isGift), mark those claims as redeemed
    try {
      const user = await User.findById(order.user);
      if (user && Array.isArray(order.items) && Array.isArray(user.claimedGifts)) {
        const purchasedGiftIds = order.items
          .filter((it: any) => Boolean(it.isGift))
          .map((it: any) => String(it.product));

        if (purchasedGiftIds.length > 0) {
          let changed = false;
          user.claimedGifts = (user.claimedGifts || []).map((g: any) => {
            if (purchasedGiftIds.includes(String(g.product)) && g.status === 'claimed') {
              changed = true;
              return { ...g.toObject ? g.toObject() : g, status: 'redeemed', redeemedAt: new Date() };
            }
            return g;
          });
          if (changed) await user.save();
        }
      }
    } catch (err) {
      console.error('Error marking claimed gifts as redeemed after purchase:', err);
    }

    // After successful payment, check if user unlocked a new gift window (>=10 products since last claim)
    let showGift = false;
    try {
      const userDoc: any = await User.findById(order.user).select('claimedGifts').lean();
      const lastClaimDate = (userDoc?.claimedGifts || [])
        .filter((g: any) => g.status !== 'revoked')
        .map((g: any) => g.claimedAt)
        .filter(Boolean)
        .sort((a: Date, b: Date) => new Date(b).getTime() - new Date(a).getTime())[0] || null;

      const pastOrdersPaid = await Order.find({ user: order.user, paymentStatus: 'paid' }).lean();
      const ordersSinceLastClaim = lastClaimDate
        ? pastOrdersPaid.filter((o: any) => new Date(o.createdAt) > new Date(lastClaimDate))
        : pastOrdersPaid;

      const totalProductsPurchasedSinceLastClaim = ordersSinceLastClaim.reduce((sum: number, o: any) => {
        return sum + (o.items || []).reduce((s2: number, it: any) => s2 + (it.quantity || 0), 0);
      }, 0);

      if (totalProductsPurchasedSinceLastClaim >= 10) showGift = true;
    } catch (err) {
      console.error('Error computing gift unlock after payment:', err);
    }

    if (order.notes !== 'buy_now') {
      try {
        await Cart.findOneAndUpdate(
          { user: order.user },
          { items: [], totalItems: 0, totalPrice: 0 }
        );
      } catch (cartErr) {
        console.error('Error clearing cart after successful payment:', cartErr);
      }
    }

    console.log('Payment verified for order', order._id.toString(), 'showGift=', showGift);
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      order,
      showGift
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}