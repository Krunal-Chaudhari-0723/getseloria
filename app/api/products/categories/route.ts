export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import SiteSettings from '@/lib/models/SiteSettings';

const DEFAULT = ['Necklace', 'Ring', 'Earring', 'Bracelet', 'Pendant', 'Bangle'];

export async function GET() {
  try {
    await connectToDatabase();
    const settings = await SiteSettings.findOne({ type: 'main' });
    const categories = settings?.categories?.length ? settings.categories : DEFAULT;
    return NextResponse.json(categories, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    return NextResponse.json(DEFAULT, { headers: { 'Cache-Control': 'no-store' } });
  }
}
