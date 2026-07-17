import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET!;

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function generateToken(userId: string, email: string, role: string) {
  return jwt.sign(
    { userId, email, role }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
}

export async function authMiddleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized - Please login' }, 
      { status: 401 }
    );
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json(
      { error: 'Invalid token - Please login again' }, 
      { status: 401 }
    );
  }

  return decoded;
}

export async function adminMiddleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' }, 
      { status: 401 }
    );
  }

  const decoded = verifyToken(token) as any;
  if (!decoded || decoded.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' }, 
      { status: 403 }
    );
  }

  return decoded;
}

export function getTokenFromRequest(req: NextRequest) {
  return req.cookies.get('token')?.value || null;
}