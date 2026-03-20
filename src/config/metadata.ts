import type { Metadata } from 'next';

import { BRAND } from '@/config';
import type { MessageKey } from '@/i18n/types';

type TranslationFn = {
  (key: MessageKey): string;
  (key: MessageKey, values: Record<string, string | number | Date>): string;
  raw: (key: MessageKey) => unknown;
};

/**
 * Builds Next.js metadata (title, description, keywords, author) from i18n.
 * Used in root layout for the default app metadata.
 */
export const getAppMetadata = (t: TranslationFn): Metadata => ({
  title: t(BRAND.name),
  description: t('metadata.description'),
  keywords: t.raw('metadata.keywords') as string[],
  authors: [{ name: t(BRAND.author) }],
  creator: t(BRAND.author),
  publisher: t(BRAND.author),
  openGraph: {
    type: 'website',
    title: t(BRAND.name),
    description: t('metadata.description'),
    siteName: t(BRAND.name),
  },
  twitter: {
    card: 'summary',
    title: t(BRAND.name),
    description: t('metadata.description'),
  },
});

/**
 * Builds page-specific metadata from i18n.
 * Reads title from `metadata.pages.<pageKey>` and description from `metadata.descriptions.<pageKey>`.
 *
 * @param t - Translation function from `getTranslations()`
 * @param pageKey - Key matching entries in `metadata.pages` and `metadata.descriptions`
 * @param params - Optional interpolation values for dynamic titles (e.g. `{ name: projectName }`)
 */
export const getPageMetadata = (
  t: TranslationFn,
  pageKey: string,
  params?: Record<string, string>
): Metadata => {
  const titleKey = `metadata.pages.${pageKey}` as MessageKey;
  const descriptionKey = `metadata.descriptions.${pageKey}` as MessageKey;
  const appTitle = t('metadata.title' as MessageKey);

  const pageTitle = params ? t(titleKey, params) : t(titleKey);

  return {
    title: `${pageTitle} | ${appTitle}`,
    description: t(descriptionKey),
  };
};
