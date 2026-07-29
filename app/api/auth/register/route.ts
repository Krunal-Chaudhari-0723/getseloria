import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { name, email, password, phone, gender, dob } = await req.json();

    // Validate input
    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'Name, email, phone number and password are required' },
        { status: 400 }
      );
    }

    if (gender && !['male', 'female', 'other'].includes(gender)) {
      return NextResponse.json(
        { error: 'Invalid gender' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      gender,
      dob: dob ? new Date(dob) : undefined,
      role: 'user'
    });

    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      gender: user.gender,
      dob: user.dob
    };

    const token = generateToken(user._id.toString(), user.email, user.role);

    const response = NextResponse.json(
      { 
        message: 'Registration successful!',
        user: userResponse 
      },
      { status: 201 }
    );

    const protocol = req.headers.get('x-forwarded-proto') || (req.nextUrl.protocol === 'https:' ? 'https' : 'http');
    const isSecure = protocol === 'https';

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}