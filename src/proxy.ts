import { NextRequest, NextResponse } from 'next/server';

import { ROUTES } from '@/config';
import i18nMiddleware from '@/i18n/config';
import { defaultLocale, locales } from '@/i18n/constants';
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

function getPathnameWithoutLocale(pathname: string): string {
  const segments = pathname.split('/');
  const maybeLocale = segments[1];

  if (maybeLocale && (locales as readonly string[]).includes(maybeLocale)) {
    return segments.length > 2 ? '/' + segments.slice(2).join('/') : '/';
  }

  return pathname || '/';
}

function copyCookies(from: NextResponse, to: NextResponse): void {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, options);
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

  const pathname = getPathnameWithoutLocale(req.nextUrl.pathname);
  const locale = req.nextUrl.pathname.split('/')[1] || defaultLocale;

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    route === ROUTES.common.home ? pathname === ROUTES.common.home : pathname.startsWith(route)
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
