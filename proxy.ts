import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SHELL_TABS = new Set([
  'transactions',
  'analytics',
  'budget',
  'goals',
  'recurring',
  'investments',
  'currency',
  'tax',
  'advisor',
  'profile',
]);

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

  // Keep the redesigned dashboard on a stable, cache-busted route. This also
  // prevents browsers from reusing stale Turbopack chunks after a hot reload.
  if (pathname === '/') {
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashboardUrl);
  }

  // Every feature shares one persistent client shell so navigation does not
  // trigger a separate route compile, document load, and duplicate data fetch.
  const shellTab = pathname.replace(/^\//, '');
  if (SHELL_TABS.has(shellTab)) {
    const shellUrl = req.nextUrl.clone();
    shellUrl.pathname = '/dashboard';
    shellUrl.search = `?tab=${shellTab}`;
    return NextResponse.redirect(shellUrl);
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
