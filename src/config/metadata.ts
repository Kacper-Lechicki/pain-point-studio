import type { Metadata } from 'next';

import { BRAND } from '@/config';

// Generates global application metadata for SEO, using localized strings
export const getAppMetadata = (t: {
  (key: string): string;
  raw: (key: string) => unknown;
}): Metadata => ({
  title: t(BRAND.name),
  description: t('metadata.description'),
  keywords: t.raw('metadata.keywords') as string[],
  authors: [{ name: t(BRAND.author) }],
  creator: t(BRAND.author),
  publisher: t(BRAND.author),
});
