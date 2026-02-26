'use client';

import { useTranslations } from 'next-intl';

import { CompletionBarChart } from '@/components/charts/completion-bar-chart';
import { SectionLabel } from '@/components/ui/metric-display';
import type { DeviceTimelinePoint } from '@/features/surveys/actions/get-survey-stats';
import { DeviceBreakdownChart } from '@/features/surveys/components/stats/device-breakdown-chart';
import { ResponseTimelineChart } from '@/features/surveys/components/stats/response-timeline-chart';

interface SurveyStatsChartsProps {
  responseTimeline: number[];
  deviceTimeline: DeviceTimelinePoint[];
  /** Aggregate: completed, in progress, abandoned (for donut) */
  completionBreakdown?: { completed: number; inProgress: number; abandoned: number };
}

export function SurveyStatsCharts({
  responseTimeline,
  deviceTimeline,
  completionBreakdown = { completed: 0, inProgress: 0, abandoned: 0 },
}: SurveyStatsChartsProps) {
  const t = useTranslations('surveys.stats');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex min-h-48 flex-col">
          <SectionLabel>{t('responsesOverTime')}</SectionLabel>
          <div className="min-h-48 flex-1">
            <ResponseTimelineChart data={responseTimeline} className="h-full min-h-48" />
          </div>
        </div>

        <div className="flex min-h-48 flex-col">
          <SectionLabel>{t('completionRate')}</SectionLabel>
          <div className="flex min-h-48 flex-1 flex-col justify-start">
            <CompletionBarChart
              data={completionBreakdown}
              labels={{
                completed: t('charts.completed'),
                inProgress: t('charts.inProgress'),
                abandoned: t('charts.abandoned'),
              }}
              noDataMessage={t('noChartData')}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            {t('deviceBreakdown')}
          </p>

          <div className="flex items-center gap-2.5">
            <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: 'var(--chart-violet)' }}
              />
              {t('deviceDesktop')}
            </span>

            <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: 'var(--chart-cyan)' }}
              />
              {t('deviceMobile')}
            </span>
          </div>
        </div>

        <DeviceBreakdownChart data={deviceTimeline} className="h-48 w-full" />
      </div>
    </div>
  );
}
