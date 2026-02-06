import createMiddleware from 'next-intl/middleware';

import { defaultLocale, locales } from '@/i18n/constants';
import { PATHNAMES } from '@/i18n/pathnames';

// Create i18n middleware with defined locales and pathnames
export default createMiddleware({
  locales,
  defaultLocale,
  pathnames: PATHNAMES,
});

// Matcher configuration for root and locale-prefixed paths
export const config = {
  matcher: ['/', `/(${locales.join('|')})/:path*`],
};
