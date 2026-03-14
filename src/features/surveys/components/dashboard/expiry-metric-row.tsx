'use client';

import { Timer } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { MetricRow } from '@/components/ui/metric-display';
import { SURVEY_RETENTION_DAYS } from '@/features/surveys/config';
import { daysUntilExpiry } from '@/lib/common/calculations';

interface ExpiryMetricRowProps {
  timestampAt: string | null | undefined;
  labelKey: string;
}

export function ExpiryMetricRow({ timestampAt, labelKey }: ExpiryMetricRowProps) {
  const t = useTranslations();
  const days = daysUntilExpiry(timestampAt, SURVEY_RETENTION_DAYS);

  if (days == null) {
    return null;
  }

  return (
    <MetricRow
      icon={Timer}
      label={t(labelKey as Parameters<typeof t>[0])}
      value={t('surveys.dashboard.detailPanel.inDays', { days })}
    />
  );
}
