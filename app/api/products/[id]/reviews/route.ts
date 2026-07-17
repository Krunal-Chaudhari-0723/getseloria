export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import mongoose from 'mongoose';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  const { rating, comment } = await req.json();
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
  }
  if (!comment?.trim()) {
    return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
  }

  await connectToDatabase();
  const [product, user] = await Promise.all([
    Product.findById(id),
    User.findById((auth as any).userId).select('name').lean<{ name: string }>(),
  ]);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const alreadyReviewed = product.reviews.some(
    (r: any) => String(r.user) === String((auth as any).userId)
  );
  if (alreadyReviewed) {
    return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 });
  }

  product.reviews.push({
    user: (auth as any).userId,
    name: user?.name || 'Customer',
    rating: Number(rating),
    comment: comment.trim(),
    createdAt: new Date(),
  });

  product.numReviews = product.reviews.length;
  product.rating = product.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / product.reviews.length;

  await product.save();

  return NextResponse.json({ message: 'Review added', rating: product.rating, numReviews: product.numReviews });
}
