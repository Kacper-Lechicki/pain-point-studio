export const BRAND = {
  name: 'brand.name',
  tagline: 'brand.tagline',
  author: 'brand.author',
} as const;

export type BrandConfig = typeof BRAND;

export const getCopyrightText = (
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  year?: number
): string => {
  const currentYear = year ?? new Date().getFullYear();

  return t('brand.copyright', {
    year: currentYear,
    author: t(BRAND.author),
  });
};
