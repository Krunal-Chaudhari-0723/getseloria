export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { adminMiddleware } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';

export async function PUT(req: NextRequest) {
  const auth = await adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();

  const decoded = auth as any;
  const { name, email, currentPassword, newPassword } = await req.json();

  const admin = await User.findById(decoded.userId);
  if (!admin) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });

  // Verify current password before allowing any change
  const isValid = await bcrypt.compare(currentPassword, admin.password);
  if (!isValid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  if (email && email !== admin.email) {
    const taken = await User.findOne({ email, _id: { $ne: admin._id } });
    if (taken) return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    admin.email = email;
  }

  if (name) admin.name = name;

  if (newPassword) {
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }
    admin.password = await bcrypt.hash(newPassword, 10);
  }

  await admin.save();

  return NextResponse.json({
    message: 'Profile updated successfully',
    user: { name: admin.name, email: admin.email, role: admin.role },
  });
}
