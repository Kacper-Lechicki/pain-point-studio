import createMiddleware from 'next-intl/middleware';

import { defaultLocale, locales } from '@/i18n/constants';

export default createMiddleware({
  locales,
  defaultLocale,
});

export const config = {
  matcher: ['/', `/(${locales.join('|')})/:path*`],
};
