import createMiddleware from 'next-intl/middleware';

import { defaultLocale, locales } from '@/i18n/constants';

export default createMiddleware({
  // A list of all locales that are supported
  locales,
  // Used when no locale matches
  defaultLocale,
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', `/(${locales.join('|')})/:path*`],
};
