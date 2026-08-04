export const dynamic = 'force-dynamic';

import { randomBytes, createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import PasswordResetToken from '@/lib/models/PasswordResetToken';
import { sendPasswordResetEmail } from '@/lib/email';

const SUCCESS_MESSAGE = 'If an account exists for that email, a password reset code has been sent.';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: normalizedEmail }).select('_id email');

    if (user) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const tokenHash = createHash('sha256').update(otpCode).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await PasswordResetToken.deleteMany({ userId: user._id });
      const resetTokenRecord = await PasswordResetToken.create({ userId: user._id, tokenHash, expiresAt });

      try {
        const origin = req.nextUrl.origin;
        const resetUrl = `${origin}/auth/reset-password?token=${otpCode}&email=${encodeURIComponent(user.email)}`;
        await sendPasswordResetEmail(user.email, otpCode, resetUrl);
      } catch (emailError) {
        await PasswordResetToken.deleteOne({ _id: resetTokenRecord._id });
        throw emailError;
      }
    }

    return NextResponse.json({ message: SUCCESS_MESSAGE });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to send the reset email right now. Please try again later.',
      },
      { status: 500 }
    );
  }
}
