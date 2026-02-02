import { getRequestConfig } from 'next-intl/server';

import { routing } from '@/i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;

  // Validate that the incoming `locale` parameter is supported
  const locale =
    requestedLocale && routing.locales.includes(requestedLocale as (typeof routing.locales)[number])
      ? requestedLocale
      : routing.defaultLocale;

  return {
    locale,
    // Load messages for the determined locale
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
