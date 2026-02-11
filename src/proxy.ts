import { NextRequest, NextResponse } from 'next/server';

import { ROUTES } from '@/config';
import i18nMiddleware from '@/i18n/config';
import { defaultLocale } from '@/i18n/constants';
import { isAuthenticated, isProtectionEnabled } from '@/lib/common/deploy-credentials';
import { updateSession } from '@/lib/supabase/middleware';

// Public routes that DON'T require authentication (allowlist approach)
// Everything else is protected by default — new routes are secure without manual registration
const PUBLIC_ROUTES = [
  ROUTES.common.home,
  '/auth/callback',
  ROUTES.auth.signIn,
  ROUTES.auth.signUp,
  ROUTES.auth.forgotPassword,
  ROUTES.auth.updatePassword,
  '/r',
];

const AUTH_ROUTES = [ROUTES.auth.signIn, ROUTES.auth.signUp, ROUTES.auth.forgotPassword];

function getPathnameWithoutLocale(pathname: string): string {
  const segments = pathname.split('/');

  if (segments.length > 2) {
    return '/' + segments.slice(2).join('/');
  }

  return '/';
}

const middleware = async (req: NextRequest) => {
  const { response: supabaseResponse, user } = await updateSession(req);

  if (isProtectionEnabled() && !isAuthenticated(req)) {
    return new NextResponse('Auth Required.', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  const pathname = getPathnameWithoutLocale(req.nextUrl.pathname);
  const locale = req.nextUrl.pathname.split('/')[1] || defaultLocale;

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    route === ROUTES.common.home ? pathname === ROUTES.common.home : pathname.startsWith(route)
  );

  if (!user && !isPublicRoute) {
    const signInUrl = new URL(`/${locale}${ROUTES.auth.signIn}`, req.url);

    return NextResponse.redirect(signInUrl);
  }

  if (
    user &&
    (pathname === ROUTES.common.home || AUTH_ROUTES.some((route) => pathname.startsWith(route)))
  ) {
    const dashboardUrl = new URL(`/${locale}${ROUTES.common.dashboard}`, req.url);

    return NextResponse.redirect(dashboardUrl);
  }

  const i18nResponse = i18nMiddleware(req);

  // Prevent bfcache on protected pages so the browser can't restore a stale
  // authenticated page after the session expires and the user is redirected.
  if (!isPublicRoute) {
    i18nResponse.headers.set('Cache-Control', 'no-store, max-age=0');
  }

  supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
    i18nResponse.cookies.set(name, value, options);
  });

  return i18nResponse;
};

export default middleware;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
