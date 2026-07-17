import { NextRequest, NextResponse } from 'next/server';
import { adminMiddleware } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';

export async function PATCH(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth instanceof NextResponse) return auth;

    await connectToDatabase();

    const { userId, productId, status } = await req.json();
    if (!userId || !productId || !status) {
      return NextResponse.json({ error: 'userId, productId and status are required' }, { status: 400 });
    }

    if (!['claimed', 'redeemed', 'revoked'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let changed = false;
    user.claimedGifts = (user.claimedGifts || []).map((g: any) => {
      if (String(g.product) === String(productId)) {
        changed = true;
        const updated = { ...g.toObject ? g.toObject() : g, status };
        if (status === 'redeemed') updated.redeemedAt = new Date();
        if (status !== 'redeemed') updated.redeemedAt = null;
        return updated;
      }
      return g;
    });

    if (!changed) return NextResponse.json({ error: 'Claim not found for this user' }, { status: 404 });

    await user.save();
    return NextResponse.json({ success: true, claimedGifts: user.claimedGifts });
  } catch (err) {
    console.error('Error updating claimed gift status:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
