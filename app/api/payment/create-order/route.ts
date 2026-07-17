import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/lib/models/Order';
import Cart from '@/lib/models/Cart';
import Product from '@/lib/models/Product';
import { authMiddleware } from '@/lib/auth';
import { getRazorpayClient } from '@/lib/razorpay';
import User from '@/lib/models/User';

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth instanceof NextResponse) return auth;
    
    await connectToDatabase();
    const decoded = auth as any;
    const { address } = await req.json();

    if (!address || !address.street || !address.city || !address.state || !address.zipCode) {
      return NextResponse.json(
        { error: 'Complete address is required' },
        { status: 400 }
      );
    }

    // Get cart
    const cart = await Cart.findOne({ user: decoded.userId })
      .populate('items.product', 'name price images stock');

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Calculate average spend from past paid orders to determine gift eligibility
    const [pastOrders, user] = await Promise.all([
      Order.find({ user: decoded.userId, paymentStatus: 'paid' }),
      User.findById(decoded.userId).select('loyaltyCards')
    ]);

    const totalSpend = pastOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalProductsPurchased = pastOrders.reduce((sum, order) => {
      return (
        sum + (order.items || []).reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0)
      );
    }, 0);
    const averageSpend = totalProductsPurchased > 0 ? totalSpend / totalProductsPurchased : 0;

    // Unlock gift if user previously purchased >=10 products or any cart item has qty >= 10
    const cartHasLargeQty = cart.items.some((it: any) => (it.quantity || 0) >= 10);
    const unlocked = totalProductsPurchased >= 10 || cartHasLargeQty;

    let totalAmount = 0;
    const orderItems: any[] = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.name} not found` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Only ${product.stock} units of ${product.name} available` },
          { status: 400 }
        );
      }

      const linePrice = item.isGift ? item.giftPrice ?? item.price : item.price;
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0] || '/placeholder-jewelry.jpg',
        quantity: item.quantity,
        price: linePrice,
        isGift: Boolean(item.isGift)
      });
      totalAmount += linePrice * (item.quantity || 0);
    }

    // Create Razorpay order
    const razorpay = getRazorpayClient();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // in paise
      currency: 'INR',
      receipt: `ORD_${Date.now()}`,
      notes: {
        userId: decoded.userId.toString()
      }
    });

    // Create order in database
    const order = await Order.create({
      user: decoded.userId,
      items: orderItems,
      totalAmount,
      shippingAddress: {
        ...address,
        email: address.email,
        phone: address.phone
      },
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: 'pending',
      orderStatus: 'pending'
    });

    return NextResponse.json({
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      amount: totalAmount,
      currency: 'INR'
    });
  } catch (error: any) {
    console.error('Error creating payment order:', error);

    if (error instanceof Error && error.message.includes('Razorpay is not configured')) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const razorpayMessage = error?.error?.description || error?.message || 'Failed to create payment order';
    return NextResponse.json(
      { error: razorpayMessage },
      { status: 500 }
    );
  }
}