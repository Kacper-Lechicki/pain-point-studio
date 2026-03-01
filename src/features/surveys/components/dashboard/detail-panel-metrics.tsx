import { BarChart3, MousePointerClick, Percent, Timer, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/ui/metric-display';
import { getSurveyStatsUrl } from '@/features/surveys/lib/survey-urls';
import Link from '@/i18n/link';

function formatTime(totalSeconds: number | null): string {
  if (totalSeconds == null) {
    return '—';
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

interface DetailPanelMetricsProps {
  surveyId: string;
  responseCount: number;
  completedCount: number;
  maxRespondents: number | null;
  respondentProgress: number | null;
  avgQuestionCompletion: number | null;
  avgCompletionSeconds: number | null;
}

export function DetailPanelMetrics({
  surveyId,
  responseCount,
  completedCount,
  maxRespondents,
  respondentProgress,
  avgQuestionCompletion,
  avgCompletionSeconds,
}: DetailPanelMetricsProps) {
  const t = useTranslations();

  return (
    <>
      <SectionLabel>{t('surveys.dashboard.detailPanel.metricsLabel')}</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <div className="border-border/50 bg-card rounded-md border px-3 py-2.5">
          <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
            {responseCount}
          </div>

          <div className="text-muted-foreground mt-1.5 flex items-start gap-1 text-[11px]">
            <MousePointerClick className="mt-0.5 size-3 shrink-0" aria-hidden />
            {t('surveys.dashboard.detailPanel.started')}
          </div>
        </div>

        <div className="border-border/50 bg-card rounded-md border px-3 py-2.5">
          <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
            {avgQuestionCompletion != null ? `${Math.round(avgQuestionCompletion)}%` : '—'}
          </div>

          <div className="text-muted-foreground mt-1.5 flex items-start gap-1 text-[11px]">
            <Percent className="mt-0.5 size-3 shrink-0" aria-hidden />
            {t('surveys.dashboard.detailPanel.avgQuestionCompletion')}
          </div>
        </div>

        <div className="border-border/50 bg-card rounded-md border px-3 py-2.5">
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

        <div className="border-border/50 bg-card rounded-md border px-3 py-2.5">
          <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
            {formatTime(avgCompletionSeconds)}
          </div>

          <div className="text-muted-foreground mt-1.5 flex items-start gap-1 text-[11px]">
            <Timer className="mt-0.5 size-3 shrink-0" aria-hidden />
            {t('surveys.dashboard.detailPanel.avgCompletionTime')}
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground mt-2.5 h-7 w-full text-xs"
        asChild
      >
        <Link href={getSurveyStatsUrl(surveyId)}>
          <BarChart3 className="size-3.5" aria-hidden />
          {t('surveys.dashboard.detailPanel.viewAnalytics')}
        </Link>
      </Button>
    </>
  );
}
