export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import Product from '@/lib/models/Product';
import Cart from '@/lib/models/Cart';
import { getTier, getNextTier } from '@/lib/loyalty';

export async function GET(req: NextRequest) {
  const auth = await authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();
  const [orders, user] = await Promise.all([
    Order.find({ user: (auth as any).userId, paymentStatus: 'paid' }).populate(
      'items.product',
      'name images price category rating stock description'
    ),
    User.findById((auth as any).userId).select('loyaltyCards giftHampers'),
  ]);
  const totalSpend = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalProductsPurchased = orders.reduce((sum, order) => {
    return (
      sum +
      (order.items || []).reduce((itemSum: number, item: any) => {
        return itemSum + (item.quantity || 0);
      }, 0)
    );
  }, 0);

  const userDoc: any = await User.findById((auth as any).userId).select('claimedGifts').lean();
  const lastClaimDate = (userDoc?.claimedGifts || [])
    .filter((gift: any) => gift.status !== 'revoked')
    .map((gift: any) => gift.claimedAt)
    .filter(Boolean)
    .sort((a: Date, b: Date) => new Date(b).getTime() - new Date(a).getTime())[0] || null;

  const ordersSinceLastClaim = lastClaimDate
    ? orders.filter((order) => new Date(order.createdAt) > new Date(lastClaimDate))
    : orders;

  const totalSpendSinceLastClaim = ordersSinceLastClaim.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalProductsPurchasedSinceLastClaim = ordersSinceLastClaim.reduce((sum, order) => {
    return (
      sum +
      (order.items || []).reduce((itemSum: number, item: any) => {
        return itemSum + (item.quantity || 0);
      }, 0)
    );
  }, 0);

  const tier = getTier(totalSpend);
  const next = getNextTier(totalSpend);

  const purchasedCategories = Array.from(
    new Set(
      orders.flatMap((order) =>
        (order.items || [])
          .map((item: any) => item.product?.category)
          .filter(Boolean)
      )
    )
  );

  const averageSpend = totalProductsPurchasedSinceLastClaim > 0 ? totalSpendSinceLastClaim / totalProductsPurchasedSinceLastClaim : 0;
  const unlockedRecommendations = totalProductsPurchasedSinceLastClaim >= 10;

  // If unlocked, show products priced at or below the average spend. If none are available,
  // fall back to the most affordable products so the gift section still appears.
  let eligibleProducts: any[] = [];
  if (unlockedRecommendations) {
    const baseQuery: any = {
      isActive: true,
      price: { $lte: averageSpend },
    };

    eligibleProducts = await Product.find(baseQuery)
      .select('name images price category rating stock description')
      .sort({ price: 1, rating: -1, createdAt: -1 })
      .lean();

    if (eligibleProducts.length === 0) {
      eligibleProducts = await Product.find({ isActive: true })
        .select('name images price category rating stock description')
        .sort({ price: 1, rating: -1, createdAt: -1 })
        .limit(8)
        .lean();
    }
  }

  // Get active claims: pending claims, plus the most recent redeemed claim if the user hasn't unlocked a new cycle yet
  const lastRedeemedClaim = (userDoc?.claimedGifts || [])
    .filter((g: any) => g.status === 'redeemed')
    .sort((a: Date, b: Date) => new Date(b).getTime() - new Date(a).getTime())[0] || null;

  const activeClaims = ((userDoc && userDoc.claimedGifts) || []).filter((g: any) => {
    if (g.status === 'claimed') return true;
    if (g.status === 'redeemed' && !unlockedRecommendations && lastRedeemedClaim && String(g._id) === String(lastRedeemedClaim._id)) {
      return true;
    }
    return false;
  });
  const claimedProductIds = activeClaims.map((g: any) => String(g.product));
  const claimedSet = new Set(claimedProductIds);

  const newEligibleProducts = (eligibleProducts || [])
    .filter((p: any) => !claimedSet.has(String(p._id)))
    .map((p: any) => ({ ...p, claimed: false }));

  const claimedProducts = claimedProductIds.length > 0
    ? await Product.find({ _id: { $in: claimedProductIds } })
        .select('name images price category rating stock description')
        .lean()
    : [];
  const claimedProductsMarked = claimedProducts.map((p: any) => ({ ...p, claimed: true }));

  const eligibleProductsWithClaim = [...newEligibleProducts, ...claimedProductsMarked];

  // Compute card-based gifts
  const cardGifts: any[] = [];
  const CARD_TYPES = ['Opal', 'Sapphire', 'Emerald', 'Pink Quartz', 'Ruby'];
  const CARD_GIFT_RANGES: Record<string, { min: number; max: number }> = {
    'Opal': { min: 99, max: 399 },
    'Sapphire': { min: 399, max: 999 },
    'Emerald': { min: 999, max: 1499 },
    'Pink Quartz': { min: 1499, max: 2499 },
    'Ruby': { min: 2499, max: 3999 },
  };

  const userLoyaltyCards = user?.loyaltyCards ?? [];
  const userGiftHampers = (user as any)?.giftHampers ?? [];

  for (const type of CARD_TYPES) {
    const totalCards = userLoyaltyCards.filter((c: any) => c.cardType === type).length;
    const fulfilledCount = userGiftHampers.filter((h: any) => h.cardType === type && h.status === 'fulfilled').length;
    const availableClaims = Math.floor(totalCards / 10) - fulfilledCount;

    if (availableClaims > 0) {
      const range = CARD_GIFT_RANGES[type] || { min: 0, max: 1000 };
      const products = await Product.find({
        isActive: true,
        price: { $gte: range.min, $lte: range.max }
      })
      .select('name images price category rating stock description')
      .sort({ price: 1 })
      .limit(12)
      .lean();

      cardGifts.push({
        cardType: type,
        availableClaims,
        products
      });
    }
  }

  return NextResponse.json({
    totalSpend,
    totalProductsPurchased,
    averageSpend,
    tier: tier.name,
    nextTier: next?.name ?? null,
    nextMin: next?.min ?? null,
    orderCount: orders.length,
    unlockedRecommendations,
    eligibleCategories: purchasedCategories,
    eligibleProducts: eligibleProductsWithClaim,
    claimedProductIds,
    loyaltyCards: user?.loyaltyCards ?? [],
    giftHampers: (user as any)?.giftHampers ?? [],
    cardGifts,
  });
}
