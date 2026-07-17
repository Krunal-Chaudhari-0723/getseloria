export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminMiddleware } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth instanceof NextResponse) return auth;

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const query: any = {};
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: search, $options: 'i' } },
        { 'shippingAddress.email': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
      ];
    }

    let recentOrdersQuery = Order.find(query).sort({ createdAt: -1 });
    if (!search) {
      recentOrdersQuery = recentOrdersQuery.limit(10);
    } else {
      recentOrdersQuery = recentOrdersQuery.limit(100);
    }

    const [totalOrders, totalProducts, totalUsers, revenueResult, ordersByStatus, recentOrders] =
      await Promise.all([
        Order.countDocuments(),
        Product.countDocuments(),
        User.countDocuments(),
        Order.aggregate([
          { $match: { paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
        Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
        recentOrdersQuery.populate('user', 'name email').lean(),
      ]);

    return NextResponse.json({
      stats: {
        totalOrders,
        totalProducts,
        totalUsers,
        totalRevenue: revenueResult[0]?.total || 0,
        ordersByStatus,
      },
      recentOrders: recentOrders.map((o: any) => ({
        ...o,
        _id: o._id.toString(),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
