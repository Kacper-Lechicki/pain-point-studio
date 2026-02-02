export const BRAND = {
  name: 'Brand.name',
  tagline: 'Brand.tagline',
  author: 'Brand.author',
} as const;

export type BrandConfig = typeof BRAND;

export const getCopyrightText = (
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  year?: number
): string => {
  const currentYear = year ?? new Date().getFullYear();

  return t('Brand.copyright', {
    year: currentYear,
    author: t(BRAND.author),
  });
};
