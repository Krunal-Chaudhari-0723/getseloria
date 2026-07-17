export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminMiddleware } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';

// Force model registration and prevent Webpack tree-shaking
const _User = User;

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();

  const { orderStatus, trackingNumber } = await req.json();

  const update: any = {};
  if (orderStatus) update.orderStatus = orderStatus;
  if (trackingNumber !== undefined) update.trackingNumber = trackingNumber;
  if (orderStatus === 'delivered') update.deliveredAt = new Date();
  if (orderStatus === 'cancelled') update.cancelledAt = new Date();

  const order = await Order.findByIdAndUpdate(params.id, update, { new: true }).populate('user', 'name email');
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  return NextResponse.json({ order });
}
