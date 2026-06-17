import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('session')?.value;
  const adminSessionToken = request.cookies.get('admin-session')?.value;

  // 1. Admin Panel Routing Protection
  if (pathname.startsWith('/admin')) {
    const isAdminLogin = pathname === '/admin/login';

    if (!isAdminLogin && !adminSessionToken) {
      // Redirect to admin login if not logged in
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    if (isAdminLogin && adminSessionToken) {
      // Redirect to admin dashboard if already logged in
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
  }

  // 2. Client Pages Routing Protection
  const protectedRoutes = ['/account', '/checkout'];
  const authRoutes = ['/login', '/register', '/forgot-password'];

  const isProtectedPath = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthPath = authRoutes.some(route => pathname.startsWith(route));

  // If it's a protected route and no client session exists, redirect to login
  if (isProtectedPath && !sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // If it's an auth route and client session exists, redirect to home
  if (isAuthPath && sessionToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Specify which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
