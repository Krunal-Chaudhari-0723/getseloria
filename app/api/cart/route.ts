export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cart from '@/lib/models/Cart';
import User from '@/lib/models/User';
import Product from '@/lib/models/Product';
import { authMiddleware } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth instanceof NextResponse) return auth;
    
    await connectToDatabase();
    const decoded = auth as any;
    
    let cart = await Cart.findOne({ user: decoded.userId })
      .populate('items.product', 'name price originalPrice discountPercent images stock');
    
    if (!cart) {
      cart = await Cart.create({ 
        user: decoded.userId, 
        items: [],
        totalItems: 0,
        totalPrice: 0
      });
    }

    // Normalize any legacy gift flags on cart items: convert to normal priced items
    let changed = false;
    for (const it of cart.items) {
      // when populated, it.product has price
      const prod = (it.product as any);
      if (it.isGift || it.giftPrice != null) {
        it.isGift = false;
        it.giftPrice = null;
        it.price = prod?.price ?? it.price;
        changed = true;
      }
    }
    if (changed) {
      await cart.save();
      await cart.populate('items.product', 'name price originalPrice discountPercent images stock');
    }

    return NextResponse.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth instanceof NextResponse) return auth;
    
    await connectToDatabase();
    const decoded = auth as any;
    const { productId, quantity = 1 } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Standard add-to-cart flow (no special restriction for previously claimed gifts)

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: `Only ${product.stock} items available in stock` },
        { status: 400 }
      );
    }

    let cart = await Cart.findOne({ user: decoded.userId });
    
    if (!cart) {
      cart = await Cart.create({ user: decoded.userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item: any) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (newQuantity > product.stock) {
        return NextResponse.json(
          { error: `Cannot add more than ${product.stock} items` },
          { status: 400 }
        );
      }
      // Update quantity normally
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        name: product.name,
        image: product.images[0] || '/placeholder-jewelry.jpg',
        price: product.price,
        quantity: quantity,
        isGift: false,
        giftPrice: null
      });
    }

    await cart.save();
    await cart.populate('items.product', 'name price originalPrice discountPercent images stock');

    return NextResponse.json({
      message: 'Item added to cart successfully',
      cart
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}