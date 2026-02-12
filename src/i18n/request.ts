/**
 * next-intl server request config: resolves locale from the request (or falls back
 * to default) and loads messages for that locale. Referenced from next.config.
 */
import { getRequestConfig } from 'next-intl/server';

import { type Locale, defaultLocale, locales } from '@/i18n/constants';

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale =
    requestedLocale && locales.includes(requestedLocale as Locale)
      ? requestedLocale
      : defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
