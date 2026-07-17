export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminMiddleware } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Product from '@/lib/models/Product';

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
      { category: { $regex: search, $options: 'i' } },
    ];
  }

  const [products, total] = await Promise.all([
    Product.find(query)
      .select('-reviews -__v')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ]);

  return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) });
}

import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  const auth = await adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectToDatabase();

    const body = await req.json();
    const { name, description, originalPrice, discountPercent, category, subcategory, images, metalType, gemstone, weight, dimensions, stock } = body;

    if (!name || !description || !originalPrice || !category || stock === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const op = Number(originalPrice);
    const disc = Number(discountPercent) || 0;

    if (disc < 0 || disc > 100) {
      return NextResponse.json({ error: 'Discount must be between 0 and 100' }, { status: 400 });
    }

    const netPrice = Math.round((op - (op * disc) / 100) * 100) / 100;

    const product = await Product.create({
      name,
      description,
      price: netPrice,
      originalPrice: op,
      discountPercent: disc,
      category,
      subcategory,
      images: images?.length ? images : [],
      metalType,
      gemstone,
      weight: weight ? Number(weight) : undefined,
      dimensions,
      stock: Number(stock),
    });

    // Clear static generation cache so the new product is visible immediately on user side
    revalidatePath('/');
    revalidatePath('/products');

    return NextResponse.json({ product }, { status: 201 });
  } catch (err: any) {
    console.error('Create product error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500 });
  }
}
