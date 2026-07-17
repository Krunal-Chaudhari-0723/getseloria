import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import Cart from '@/lib/models/Cart';
import Product from '@/lib/models/Product';

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth instanceof NextResponse) return auth;

    await connectToDatabase();
    const decoded = auth as any;
    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

    const user = await User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let found = false;
    user.claimedGifts = (user.claimedGifts || []).map((g: any) => {
      if (String(g.product) === String(productId) && g.status === 'claimed') {
        found = true;
        return { ...g.toObject ? g.toObject() : g, status: 'revoked', redeemedAt: null };
      }
      return g;
    });

    if (!found) return NextResponse.json({ error: 'No active claim found for this product' }, { status: 404 });

    await user.save();

    // Update cart: convert any gift line for this product to regular priced item (so user can purchase)
    try {
      const cart = await Cart.findOne({ user: decoded.userId });
      if (cart) {
        const idx = cart.items.findIndex((it: any) => String(it.product) === String(productId));
        if (idx > -1) {
          const prod = await Product.findById(productId);
          if (prod) {
            cart.items[idx].isGift = false;
            cart.items[idx].giftPrice = null;
            cart.items[idx].price = prod.price;
            // leave quantity as-is (if claim forced it to 1 earlier, user can update quantity now)
            await cart.save();
          }
        }
      }
    } catch (err) {
      console.error('Error updating cart after revoke:', err);
    }

    return NextResponse.json({ success: true, claimedGifts: user.claimedGifts });
  } catch (err) {
    console.error('Error revoking claim:', err);
    return NextResponse.json({ error: 'Failed to revoke claim' }, { status: 500 });
  }
}
