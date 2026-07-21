export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Voucher from '@/lib/models/Voucher';
import { authMiddleware } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth instanceof NextResponse) return auth;

    await connectToDatabase();
    const decoded = auth as any;

    const vouchers = await Voucher.find({ user: decoded.userId })
      .populate('order', 'orderNumber totalAmount')
      .sort({ createdAt: -1 });

    return NextResponse.json({ vouchers });
  } catch (error: any) {
    console.error('Error fetching vouchers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vouchers', details: error.message },
      { status: 500 }
    );
  }
}
