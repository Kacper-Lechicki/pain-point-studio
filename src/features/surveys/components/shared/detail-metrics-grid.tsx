import { Hash, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SectionLabel } from './metric-display';

interface DetailMetricsGridProps {
  questionCount: number;
  completedCount: number;
  maxRespondents: number | null;
  completionRate: number | null;
  lastResponseLabel: string | null;
  respondentProgress: number | null;
  isDraft: boolean;
  isArchived: boolean;
}

export function DetailMetricsGrid({
  questionCount,
  completedCount,
  maxRespondents,
  completionRate,
  lastResponseLabel,
  respondentProgress,
  isDraft,
  isArchived,
}: DetailMetricsGridProps) {
  const t = useTranslations();

  return (
    <>
      <SectionLabel>{t('surveys.dashboard.detailPanel.metricsLabel')}</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <div className="border-border/50 rounded-md border px-3 py-2.5">
          <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
            {questionCount}
          </div>
          <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-[11px]">
            <Hash className="size-3" aria-hidden />
            {t('surveys.dashboard.detailPanel.questions')}
          </div>
        </div>
        {!isDraft && !isArchived && (
          <div className="border-border/50 rounded-md border px-3 py-2.5">
            <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
              {completedCount}
              {maxRespondents != null && (
                <span className="text-muted-foreground text-xs font-normal">
                  {' '}
                  / {maxRespondents}
                </span>
              )}
            </div>
            <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-[11px]">
              <Users className="size-3" aria-hidden />
              {t('surveys.dashboard.detailPanel.responses')}
            </div>
            {respondentProgress != null && (
              <div className="bg-muted mt-2 h-1 w-full overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${respondentProgress}%` }}
                />
              </div>
            )}
          </div>
        )}
        {!isArchived && !isDraft && completionRate != null && (
          <div className="border-border/50 rounded-md border px-3 py-2.5">
            <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
              {completionRate}%
            </div>
            <div className="text-muted-foreground mt-1.5 text-[11px]">
              {t('surveys.dashboard.detailPanel.completionRate')}
            </div>
          </div>
        )}
        {!isArchived && !isDraft && lastResponseLabel != null && (
          <div className="border-border/50 rounded-md border px-3 py-2.5">
            <div className="text-foreground text-sm leading-none font-semibold">
              {lastResponseLabel}
            </div>
            <div className="text-muted-foreground mt-1.5 text-[11px]">
              {t('surveys.dashboard.detailPanel.lastResponse')}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
