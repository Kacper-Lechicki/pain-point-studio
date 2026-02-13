import type { MessageKey } from '@/i18n/types';

/** Central brand config: i18n keys for name, tagline, author. */
export const BRAND = {
  name: 'brand.name',
  tagline: 'brand.tagline',
  author: 'brand.author',
} as const;

export type BrandConfig = typeof BRAND;

/**
 * Returns localized copyright string (e.g. "© {year} {author}").
 * @param t - Translation function (useTranslations())
 * @param year - Optional year; defaults to current year
 */
export const getCopyrightText = (
  t: (key: MessageKey, values?: Record<string, string | number | Date>) => string,
  year?: number
): string => {
  const currentYear = year ?? new Date().getFullYear();

  return t('brand.copyright', {
    year: currentYear,
    author: t('brand.author'),
  });
};
