export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import { authMiddleware } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth instanceof NextResponse) return auth;
    
    await connectToDatabase();
    const decoded = auth as any;
    
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      // Token valid but user was recreated — return JWT data so UI doesn't break
      return NextResponse.json({
        user: { _id: decoded.userId, email: decoded.email, role: decoded.role, name: decoded.email.split('@')[0] }
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}