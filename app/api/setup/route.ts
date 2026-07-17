import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';

// GET /api/setup — force reset admin account (delete & recreate fresh)
export async function GET() {
  try {
    await connectToDatabase();

    // Remove any existing admin@gmail.com to start fresh
    await User.deleteOne({ email: 'admin@gmail.com' });

    const hashed = await bcrypt.hash('02230223', 10);
    await User.create({
      name: 'Admin',
      email: 'admin@gmail.com',
      password: hashed,
      role: 'admin',
    });

    const verify = await User.findOne({ email: 'admin@gmail.com' });
    const passwordOk = await bcrypt.compare('02230223', verify!.password);

    return NextResponse.json({
      message: '✅ Admin account reset successfully',
      email: 'admin@gmail.com',
      password: '02230223',
      passwordVerified: passwordOk,
      role: verify!.role,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
