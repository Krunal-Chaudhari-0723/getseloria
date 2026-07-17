export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminMiddleware } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import SiteSettings from '@/lib/models/SiteSettings';

export async function GET(req: NextRequest) {
  const auth = await adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectToDatabase();
    let settings = await SiteSettings.findOne({ type: 'main' });
    if (!settings) settings = await SiteSettings.create({ type: 'main' });
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectToDatabase();
    const body = await req.json();
    const update: any = {};
    if (body.contact !== undefined) update.contact = body.contact;
    if (body.terms !== undefined) update.terms = body.terms;
    if (body.categories !== undefined) update.categories = body.categories;
    const settings = await SiteSettings.findOneAndUpdate(
      { type: 'main' },
      { $set: update },
      { upsert: true, new: true }
    );
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
