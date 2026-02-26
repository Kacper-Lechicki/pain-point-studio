'use client';

import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import type { ProjectSurvey } from '@/features/projects/actions/get-project';
import { KPI_COLOR_ALL, SURVEY_STATUS_CONFIG } from '@/features/surveys/config/survey-status';
import type { SurveyStatus } from '@/features/surveys/types';
import type { MessageKey } from '@/i18n/types';

interface SurveyKpiBarProps {
  surveys: ProjectSurvey[];
}

const KPI_STATUSES: { status: SurveyStatus | 'all'; key: string }[] = [
  { status: 'all', key: 'projects.detail.research.kpi.total' },
  { status: 'active', key: 'projects.detail.research.kpi.active' },
  { status: 'completed', key: 'projects.detail.research.kpi.completed' },
  { status: 'draft', key: 'projects.detail.research.kpi.draft' },
  { status: 'cancelled', key: 'projects.detail.research.kpi.cancelled' },
];

export function SurveyKpiBar({ surveys }: SurveyKpiBarProps) {
  const t = useTranslations();

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: surveys.length };

    for (const s of surveys) {
      c[s.status] = (c[s.status] ?? 0) + 1;
    }

    return c;
  }, [surveys]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {KPI_STATUSES.map(({ status, key }, i) => {
        const count = counts[status] ?? 0;
        const colorClass = status === 'all' ? KPI_COLOR_ALL : SURVEY_STATUS_CONFIG[status].kpiColor;

        return (
          <div key={status} className="flex items-center gap-3">
            {i > 0 && (
              <span className="text-border text-xs" aria-hidden>
                /
              </span>
            )}
            <div className="flex items-center gap-1">
              <span className={`text-base font-semibold tabular-nums ${colorClass}`}>{count}</span>
              <span className="text-muted-foreground text-xs">{t(key as MessageKey)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
