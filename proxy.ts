import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname, searchParams } = request.nextUrl;

  // Only protect /admin routes - all other routes are public
  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginRoute = pathname.startsWith('/admin/login');

  if (isAdminRoute && !isLoginRoute) {
    // Protect admin routes (except login)
    if (!session) {
      const loginUrl = new URL('/admin/login', request.url);
      
      // Preserve the full path with query params as callback
      const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      loginUrl.searchParams.set('callbackUrl', fullPath);
      
      // Pass through invitation params (type, email, phone) for auto-population
      const inviteType = searchParams.get('type');
      const inviteEmail = searchParams.get('email');
      const invitePhone = searchParams.get('phone');
      
      if (inviteType) {
        loginUrl.searchParams.set('type', inviteType);
      }
      if (inviteEmail) {
        loginUrl.searchParams.set('email', inviteEmail);
      }
      if (invitePhone) {
        loginUrl.searchParams.set('phone', invitePhone);
      }
      
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from login page
  if (isLoginRoute && session) {
    const callbackUrl = searchParams.get('callbackUrl') || '/admin';
    return NextResponse.redirect(new URL(callbackUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - api routes
     * - public folder assets
     */
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon\\.ico|sw\\.js|site\\.webmanifest|manifest\\.webmanifest|manifest\\.json|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.ico|api/).*)',
    '/', // Explicitly include root path
  ],
};
