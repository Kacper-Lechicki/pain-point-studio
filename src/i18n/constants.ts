/**
 * Supported locales and default. Used by i18n config, routing, and translation loading.
 * When adding a locale: update locales, add messages/{locale}.json, and proxy matcher.
 */
export const locales = ['en'] as const;
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];
