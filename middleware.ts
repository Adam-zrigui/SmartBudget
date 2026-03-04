import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple middleware: redirect unauthenticated users based on presence of
// the auth token cookie. The token is validated on the server in each
// API route, avoiding use of `process` or firebase-admin in the edge runtime.
export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // public or static resources skip auth check
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/auth/signin') ||
    pathname === '/login' // still allow legacy redirect page
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('_auth_token')?.value;
  if (!token) {
    // Pass the original URL as callbackUrl so user returns to intended page after signin
    const callbackUrl = encodeURIComponent(pathname + req.nextUrl.search);
    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${callbackUrl}`, req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|public|favicon.ico).*)'],
};
