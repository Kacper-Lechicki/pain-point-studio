import { NextRequest, NextResponse } from 'next/server';

import { ROUTES } from '@/config';
import i18nMiddleware from '@/i18n/config';
import { type Locale, defaultLocale, locales } from '@/i18n/constants';
import { isAuthenticated, isProtectionEnabled } from '@/lib/common/deploy-credentials';
import { updateSession } from '@/lib/supabase/middleware';

// Public routes (allowlist) — no auth required; everything else is protected by default.
const PUBLIC_ROUTES = [
  ROUTES.common.home,
  ROUTES.auth.callback,
  ROUTES.auth.signIn,
  ROUTES.auth.signUp,
  ROUTES.auth.forgotPassword,
  ROUTES.auth.updatePassword,
  ROUTES.survey.respond,
];

// Auth pages — logged-in users are redirected to dashboard when visiting these.
const AUTH_ROUTES = [ROUTES.auth.signIn, ROUTES.auth.signUp, ROUTES.auth.forgotPassword];
const LOCALE_LIST: readonly string[] = locales;

function getPathnameAndLocale(pathname: string): { pathname: string; locale: Locale } {
  const segments = pathname.split('/').filter(Boolean);
  const maybeLocale = segments[0];

  if (maybeLocale && LOCALE_LIST.includes(maybeLocale)) {
    const pathWithoutLocale = segments.length > 1 ? '/' + segments.slice(1).join('/') : '/';

    return { pathname: pathWithoutLocale, locale: maybeLocale as Locale };
  }

  return { pathname: pathname && pathname.startsWith('/') ? pathname : '/', locale: defaultLocale };
}

function copyCookies(from: NextResponse, to: NextResponse): void {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value, cookie);
  });
}

const middleware = async (req: NextRequest) => {
  const { response: supabaseResponse, user } = await updateSession(req);

  // Enforce Basic Auth when deploy protection is enabled (e.g. preview envs).
  if (isProtectionEnabled() && !isAuthenticated(req)) {
    return new NextResponse('Auth Required.', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  const { pathname, locale } = getPathnameAndLocale(req.nextUrl.pathname);

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  // Unauthenticated on protected route — redirect to sign-in and forward session cookies.
  if (!user && !isPublicRoute) {
    const res = NextResponse.redirect(new URL(`/${locale}${ROUTES.auth.signIn}`, req.url));

    copyCookies(supabaseResponse, res);

    return res;
  }

  // Logged-in on home or auth page — redirect to dashboard and forward session cookies.
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  if (user && (pathname === ROUTES.common.home || isAuthRoute)) {
    const res = NextResponse.redirect(new URL(`/${locale}${ROUTES.common.dashboard}`, req.url));

    copyCookies(supabaseResponse, res);

    return res;
  }

  const i18nResponse = i18nMiddleware(req);

  // Disable bfcache on protected pages so expired sessions don’t restore stale auth UI.
  if (!isPublicRoute) {
    i18nResponse.headers.set('Cache-Control', 'no-store, max-age=0');
  }

  copyCookies(supabaseResponse, i18nResponse);

  return i18nResponse;
};

export default middleware;

// Run middleware for app routes only; skip static assets and images.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
