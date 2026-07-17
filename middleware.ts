import { NextRequest, NextResponse } from 'next/server';

// jsonwebtoken doesn't work in Edge Runtime — decode payload manually.
// Real signature verification still happens in adminMiddleware (Node.js runtime).
function decodeTokenPayload(token: string): any {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

const USER_ONLY_PATHS = ['/', '/products', '/cart', '/checkout', '/orders', '/profile', '/about', '/contact', '/terms'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token')?.value;
  const payload = token ? decodeTokenPayload(token) : null;

  // Protect admin routes — must be logged in as admin
  if (pathname.startsWith('/admin')) {
    if (!token) return NextResponse.redirect(new URL('/auth/login', req.url));
    if (!payload || payload.role !== 'admin') return NextResponse.redirect(new URL('/', req.url));
    return NextResponse.next();
  }

  // Redirect admin users away from user-facing pages to admin dashboard
  if (payload?.role === 'admin') {
    const isUserPage = USER_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
    if (isUserPage) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/', '/products/:path*', '/cart', '/checkout', '/orders/:path*', '/profile', '/about', '/contact', '/terms'],
};
