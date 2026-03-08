import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Redirect unauthenticated users based on presence of auth token cookie.
// Token validity is still verified inside API routes.
export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/auth/signin') ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('_auth_token')?.value;
  if (!token) {
    const callbackUrl = encodeURIComponent(pathname + req.nextUrl.search);
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|public|favicon.ico).*)'],
};
