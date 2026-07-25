export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminMiddleware } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';

const VALID_CARDS = ['Opal', 'Sapphire', 'Emerald', 'Pink Quartz', 'Ruby'];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await adminMiddleware(req);
    if (auth instanceof NextResponse) return auth;

    const { cardType } = await req.json();
    if (!VALID_CARDS.includes(cardType)) {
      return NextResponse.json({ error: 'Invalid card type' }, { status: 400 });
    }

    await connectToDatabase();
    const existing = await User.findById(params.id).select('loyaltyCards giftHampers');
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const countForType = (existing.loyaltyCards || []).filter((c: any) => c.cardType === cardType).length;
    const currentHampers = (existing.giftHampers || []).filter((g: any) => g.cardType === cardType).length;

    let user = await User.findByIdAndUpdate(
      params.id,
      { $push: { loyaltyCards: { cardType, assignedAt: new Date() } } },
      { new: true }
    ).select('loyaltyCards giftHampers name email');

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Award a gift hamper the moment this card type reaches a multiple of 10
    const expectedHampers = Math.floor((countForType + 1) / 10);
    let giftAwarded = false;
    if (currentHampers < expectedHampers) {
      user = await User.findByIdAndUpdate(
        params.id,
        { $push: { giftHampers: { cardType, status: 'pending', awardedAt: new Date() } } },
        { new: true }
      ).select('loyaltyCards giftHampers name email');
      giftAwarded = true;
    }

    return NextResponse.json({
      loyaltyCards: user.loyaltyCards,
      giftHampers: user.giftHampers,
      giftAwarded,
      cardType
    });
  } catch (error: any) {
    console.error('Error assigning card:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await adminMiddleware(req);
    if (auth instanceof NextResponse) return auth;

    const { cardId } = await req.json();

    await connectToDatabase();
    const user = await User.findByIdAndUpdate(
      params.id,
      { $pull: { loyaltyCards: { _id: cardId } } },
      { new: true }
    ).select('loyaltyCards giftHampers name email');

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ loyaltyCards: user.loyaltyCards, giftHampers: user.giftHampers });
  } catch (error: any) {
    console.error('Error deleting card:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
