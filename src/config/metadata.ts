import type { Metadata } from 'next';

import { BRAND } from '@/config';
import type { MessageKey } from '@/i18n/types';

export const getAppMetadata = (t: {
  (key: MessageKey): string;
  raw: (key: MessageKey) => unknown;
}): Metadata => ({
  title: t(BRAND.name),
  description: t('metadata.description'),
  keywords: t.raw('metadata.keywords') as string[],
  authors: [{ name: t(BRAND.author) }],
  creator: t(BRAND.author),
  publisher: t(BRAND.author),
});
