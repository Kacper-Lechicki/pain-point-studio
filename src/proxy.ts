import { NextRequest, NextResponse } from 'next/server';

import { ROUTES } from '@/config/routes';
import i18nMiddleware from '@/i18n/config';
import { isAuthenticated, isProtectionEnabled } from '@/lib/common/deploy-credentials';
import { updateSession } from '@/lib/supabase/middleware';

const PROTECTED_ROUTES = [ROUTES.common.dashboard, ROUTES.common.settings];
const AUTH_ROUTES = [ROUTES.auth.signIn, ROUTES.auth.signUp, ROUTES.auth.forgotPassword];

/**
 * Extracts the pathname without the locale prefix.
 * E.g. "/en/dashboard" → "/dashboard", "/en" → "/"
 */
function getPathnameWithoutLocale(pathname: string): string {
  const segments = pathname.split('/');

  // Remove the locale segment (e.g. "/en/dashboard" → ["", "en", "dashboard"])
  if (segments.length > 2) {
    return '/' + segments.slice(2).join('/');
  }

  return '/';
}

export default async function middleware(req: NextRequest) {
  const { response: supabaseResponse, user } = await updateSession(req);

  // Basic auth protection for deploy gating (production only)
  if (isProtectionEnabled() && !isAuthenticated(req)) {
    return new NextResponse('Auth Required.', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  const pathname = getPathnameWithoutLocale(req.nextUrl.pathname);

  // Route protection: redirect unauthenticated users away from protected routes
  if (!user && PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    const locale = req.nextUrl.pathname.split('/')[1] || 'en';
    const signInUrl = new URL(`/${locale}${ROUTES.auth.signIn}`, req.url);

    return NextResponse.redirect(signInUrl);
  }

  // Route protection: redirect authenticated users from home and auth pages to dashboard
  if (user && (pathname === '/' || AUTH_ROUTES.some((route) => pathname.startsWith(route)))) {
    const locale = req.nextUrl.pathname.split('/')[1] || 'en';
    const dashboardUrl = new URL(`/${locale}${ROUTES.common.dashboard}`, req.url);

    return NextResponse.redirect(dashboardUrl);
  }

  // Run i18n middleware and propagate Supabase session cookies
  const i18nResponse = i18nMiddleware(req);

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    i18nResponse.cookies.set(cookie.name, cookie.value);
  });

  return i18nResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
