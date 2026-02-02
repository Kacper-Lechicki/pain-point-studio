import type { Metadata } from 'next';

import { BRAND } from '@/config/brand';

export const getAppMetadata = (t: {
  (key: string): string;
  raw: (key: string) => unknown;
}): Metadata => ({
  title: t(BRAND.name),
  description: t('Metadata.description'),
  keywords: t.raw('Metadata.keywords') as string[],
  authors: [{ name: t(BRAND.author) }],
  creator: t(BRAND.author),
  publisher: t(BRAND.author),
});
