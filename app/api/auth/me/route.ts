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

export async function PUT(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth instanceof NextResponse) return auth;

    await connectToDatabase();
    const decoded = auth as any;

    const { name, phone, gender, dob, address } = await req.json();

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (gender !== undefined) updateData.gender = gender;
    if (dob !== undefined) updateData.dob = dob ? new Date(dob) : null;
    if (address) {
      updateData.address = {
        street: address.street?.trim() || '',
        city: address.city?.trim() || '',
        state: address.state?.trim() || '',
        zipCode: address.zipCode?.trim() || '',
        country: address.country?.trim() || 'India',
      };
    }

    const user = await User.findByIdAndUpdate(decoded.userId, updateData, { new: true }).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}