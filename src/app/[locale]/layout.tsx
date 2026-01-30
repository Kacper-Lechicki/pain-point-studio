import type { ReactNode } from 'react';

import { setRequestLocale } from 'next-intl/server';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Enable static rendering for this locale
  setRequestLocale(locale);

  return children;
}

// Generate static params for all supported locales
export function generateStaticParams() {
  return [{ locale: 'en' }];
}
