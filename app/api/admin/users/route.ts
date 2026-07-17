export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminMiddleware } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import Order from '@/lib/models/Order';
import { getTier } from '@/lib/loyalty';

export async function GET(req: NextRequest) {
  const auth = await adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';

  const query: any = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<any[]>(),
    User.countDocuments(query),
  ]);

  // Attach loyalty tier to each user
  const spendData = await Order.aggregate([
    { $match: { user: { $in: users.map((u: any) => u._id) }, paymentStatus: 'paid' } },
    { $group: { _id: '$user', totalSpend: { $sum: '$totalAmount' } } },
  ]);
  const spendMap: Record<string, number> = {};
  for (const s of spendData) spendMap[String(s._id)] = s.totalSpend;

  const usersWithTier = users.map((u: any) => ({
    ...u,
    totalSpend: spendMap[String(u._id)] ?? 0,
    loyaltyTier: getTier(spendMap[String(u._id)] ?? 0).name,
  }));

  return NextResponse.json({ users: usersWithTier, total, page, pages: Math.ceil(total / limit) });
}
