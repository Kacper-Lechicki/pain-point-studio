import createMiddleware from 'next-intl/middleware';

import { defaultLocale, locales } from '@/i18n/constants';
import { PATHNAMES } from '@/i18n/pathnames';

export default createMiddleware({
  locales,
  defaultLocale,
  pathnames: PATHNAMES,
});

export const config = {
  matcher: ['/', `/(${locales.join('|')})/:path*`],
};
