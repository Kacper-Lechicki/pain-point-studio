import { getRequestConfig } from 'next-intl/server';

import { routing } from '@/i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;

  // Validate and resolve the locale, falling back to default if invalid
  const locale =
    requestedLocale && routing.locales.includes(requestedLocale as (typeof routing.locales)[number])
      ? requestedLocale
      : routing.defaultLocale;

  return {
    locale,
    // Load translation messages for the resolved locale
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
