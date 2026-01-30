import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  // Use the locale from the routing or fallback to 'en'
  const locale = (await requestLocale) ?? 'en';

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
