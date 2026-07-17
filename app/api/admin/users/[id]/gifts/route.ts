export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminMiddleware } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const { giftId, cardType, status } = await req.json();
  if (!['pending', 'fulfilled'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  await connectToDatabase();
  const user = await User.findById(params.id);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let found = false;
  user.giftHampers = (user.giftHampers || []).map((g: any) => {
    const isMatch = giftId ? (g._id && g._id.toString() === giftId) : (g.cardType === cardType);
    if (isMatch && !found) {
      found = true;
      const updated = { ...(g.toObject ? g.toObject() : g), status };
      updated.fulfilledAt = status === 'fulfilled' ? new Date() : null;
      return updated;
    }
    return g;
  });

  // Backfill: user reached 10/10 before gift hampers were tracked — create the entry now
  if (!found && cardType) {
    user.giftHampers.push({
      cardType,
      status,
      awardedAt: new Date(),
      fulfilledAt: status === 'fulfilled' ? new Date() : null,
    });
  }

  await user.save();
  return NextResponse.json({ giftHampers: user.giftHampers });
}
