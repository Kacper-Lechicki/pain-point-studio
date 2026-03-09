'use client';

import { Construction } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/components/ui/empty-state';

export function OverviewTab() {
  const t = useTranslations('surveys.stats');

  return (
    <EmptyState
      icon={Construction}
      title={t('overviewUnderConstruction.title')}
      description={t('overviewUnderConstruction.description')}
      accent="primary"
      variant="card"
    />
  );
}
