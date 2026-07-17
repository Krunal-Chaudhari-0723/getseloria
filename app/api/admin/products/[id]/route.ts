export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminMiddleware } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Product from '@/lib/models/Product';

import { revalidatePath } from 'next/cache';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();

  const body = await req.json();
  const update: any = { ...body };

  if (body.originalPrice !== undefined) {
    const op = Number(body.originalPrice);
    const disc = Number(body.discountPercent) || 0;

    if (disc < 0 || disc > 100) {
      return NextResponse.json({ error: 'Discount must be between 0 and 100' }, { status: 400 });
    }

    update.originalPrice = op;
    update.discountPercent = disc;
    update.price = Math.round((op - (op * disc) / 100) * 100) / 100;
  }
  if (body.stock !== undefined) update.stock = Number(body.stock);

  const product = await Product.findByIdAndUpdate(
    params.id,
    update,
    { new: true, runValidators: true }
  );

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  // Clear static generation cache so updates show immediately on user side
  revalidatePath('/');
  revalidatePath('/products');

  return NextResponse.json({ product });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();

  const product = await Product.findByIdAndDelete(params.id);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  // Clear static generation cache so deletions show immediately on user side
  revalidatePath('/');
  revalidatePath('/products');

  return NextResponse.json({ message: 'Product deleted' });
}
