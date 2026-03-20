import { notFound } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { getPageMetadata } from '@/config';

export async function generateMetadata() {
  const t = await getTranslations();

  return getPageMetadata(t, 'notFound');
}

export default function NotFoundCatchAll() {
  notFound();
}
