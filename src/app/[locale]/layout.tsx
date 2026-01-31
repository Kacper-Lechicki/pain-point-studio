import type { ReactNode } from 'react';

import { setRequestLocale } from 'next-intl/server';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return children;
}

export function generateStaticParams() {
  return [{ locale: 'en' }];
}
