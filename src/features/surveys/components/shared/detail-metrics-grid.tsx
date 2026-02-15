import { Clock, ListChecks, MousePointerClick, Percent, Timer, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { formatCompletionTime } from '@/features/surveys/lib/calculations';

import { SectionLabel } from './metric-display';

interface DetailMetricsGridProps {
  completedCount: number;
  responseCount: number;
  maxRespondents: number | null;
  submissionRate: number | null;
  avgQuestionCompletion: number | null;
  avgCompletionSeconds: number | null;
  lastResponseLabel: string | null;
  respondentProgress: number | null;
  isActive: boolean;
}

export function DetailMetricsGrid({
  completedCount,
  responseCount,
  maxRespondents,
  submissionRate,
  avgQuestionCompletion,
  avgCompletionSeconds,
  lastResponseLabel,
  respondentProgress,
  isActive,
}: DetailMetricsGridProps) {
  const inProgressCount = responseCount - completedCount;
  const completionTimeLabel = formatCompletionTime(avgCompletionSeconds);
  const t = useTranslations();

  return (
    <>
      <SectionLabel>{t('surveys.dashboard.detailPanel.metricsLabel')}</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <div className="border-border/50 rounded-md border px-3 py-2.5">
          <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
            {responseCount}
          </div>
          <div className="text-muted-foreground mt-1.5 flex items-start gap-1 text-[11px]">
            <MousePointerClick className="mt-0.5 size-3 shrink-0" aria-hidden />
            {t('surveys.dashboard.detailPanel.visitors')}
          </div>
        </div>
        <div className="border-border/50 rounded-md border px-3 py-2.5">
          <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
            {completedCount}
            {maxRespondents != null && (
              <span className="text-muted-foreground text-xs font-normal"> / {maxRespondents}</span>
            )}
          </div>
          <div className="text-muted-foreground mt-1.5 flex items-start gap-1 text-[11px]">
            <Users className="mt-0.5 size-3 shrink-0" aria-hidden />
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
        {isActive && inProgressCount > 0 && (
          <div className="border-border/50 rounded-md border px-3 py-2.5">
            <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
              {inProgressCount}
            </div>
            <div className="text-muted-foreground mt-1.5 flex items-start gap-1 text-[11px]">
              <Clock className="mt-0.5 size-3 shrink-0" aria-hidden />
              {t('surveys.dashboard.detailPanel.inProgress')}
            </div>
          </div>
        )}
        {submissionRate != null && (
          <div className="border-border/50 rounded-md border px-3 py-2.5">
            <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
              {submissionRate}%
            </div>
            <div className="text-muted-foreground mt-1.5 flex items-start gap-1 text-[11px]">
              <Percent className="mt-0.5 size-3 shrink-0" aria-hidden />
              {t('surveys.dashboard.detailPanel.submissionRate')}
            </div>
          </div>
        )}
        {avgQuestionCompletion != null && (
          <div className="border-border/50 rounded-md border px-3 py-2.5">
            <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
              {avgQuestionCompletion}%
            </div>
            <div className="text-muted-foreground mt-1.5 flex items-start gap-1 text-[11px]">
              <ListChecks className="mt-0.5 size-3 shrink-0" aria-hidden />
              {t('surveys.dashboard.detailPanel.avgQuestionCompletion')}
            </div>
          </div>
        )}
        {completionTimeLabel != null && (
          <div className="border-border/50 rounded-md border px-3 py-2.5">
            <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
              {completionTimeLabel}
            </div>
            <div className="text-muted-foreground mt-1.5 flex items-start gap-1 text-[11px]">
              <Timer className="mt-0.5 size-3 shrink-0" aria-hidden />
              {t('surveys.dashboard.detailPanel.avgCompletionTime')}
            </div>
          </div>
        )}
        {lastResponseLabel != null && (
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
