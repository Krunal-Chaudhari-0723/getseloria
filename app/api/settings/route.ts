export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import SiteSettings from '@/lib/models/SiteSettings';

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await SiteSettings.findOne({ type: 'main' });
    if (!settings) {
      settings = await SiteSettings.create({ type: 'main' });
    }
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
