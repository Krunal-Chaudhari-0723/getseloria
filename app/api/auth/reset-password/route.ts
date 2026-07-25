export const dynamic = 'force-dynamic';

import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import PasswordResetToken from '@/lib/models/PasswordResetToken';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Reset token and password are required' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await connectToDatabase();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const resetToken = await PasswordResetToken.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    });

    if (!resetToken) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(resetToken.userId, { password: hashedPassword });

    if (!user) {
      await PasswordResetToken.deleteOne({ _id: resetToken._id });
      return NextResponse.json({ error: 'This reset link is invalid or has expired' }, { status: 400 });
    }

    await PasswordResetToken.deleteOne({ _id: resetToken._id });
    return NextResponse.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Unable to reset password. Please try again.' }, { status: 500 });
  }
}
