'use client';

import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import type { SurveyStatusDistribution } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';

interface OverviewMetricSurveysProps {
  totalSurveys: number;
  distribution: SurveyStatusDistribution;
}

export function OverviewMetricSurveys({ totalSurveys, distribution }: OverviewMetricSurveysProps) {
  const t = useTranslations();

  const parts: string[] = [];

  if (distribution.active > 0) {
    parts.push(`${distribution.active} ${t('projects.overview.active' as MessageKey)}`);
  }

  if (distribution.draft > 0) {
    parts.push(`${distribution.draft} ${t('projects.overview.draft' as MessageKey)}`);
  }

  if (distribution.completed > 0) {
    parts.push(`${distribution.completed} ${t('projects.overview.completed' as MessageKey)}`);
  }

  return (
    <Card className="gap-0 px-4 py-4 shadow-none">
      <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {t('projects.overview.surveys' as MessageKey)}
      </p>

      <div className="mt-2">
        <p className="text-foreground text-2xl font-semibold tabular-nums">{totalSurveys}</p>

        {parts.length > 0 ? (
          <p className="text-muted-foreground mt-1 text-xs">{parts.join(' · ')}</p>
        ) : (
          <span className="text-muted-foreground mt-1 block text-xs">&mdash;</span>
        )}
      </div>
    </Card>
  );
}
