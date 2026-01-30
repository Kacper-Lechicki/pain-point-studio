import i18nMiddleware from '@/i18n/config';

export default i18nMiddleware;

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(de|en)/:path*'],
};
