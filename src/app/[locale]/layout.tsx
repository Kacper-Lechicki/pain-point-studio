import type { ReactNode } from 'react';

import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n/constants';

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

const LocaleLayout = async ({ children, params }: LocaleLayoutProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return children;
};

export default LocaleLayout;

export function generateStaticParams() {
  return locales.map((locale: string) => ({ locale }));
}
