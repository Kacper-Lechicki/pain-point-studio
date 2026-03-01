'use client';

import { useTranslations } from 'next-intl';

import { CompletionBarChart } from '@/components/charts/completion-bar-chart';
import { Card, CardContent } from '@/components/ui/card';
import { BENTO_CARD_CLASS } from '@/features/dashboard/components/bento/bento-styles';
import type { DeviceTimelinePoint } from '@/features/surveys/actions/get-survey-stats';
import { DeviceBreakdownChart } from '@/features/surveys/components/stats/device-breakdown-chart';
import { ResponseTimelineChart } from '@/features/surveys/components/stats/response-timeline-chart';
import { cn } from '@/lib/common/utils';

function ChartLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wider uppercase">
      {children}
    </p>
  );
}

// ── Response Timeline ────────────────────────────────────────────────

interface ResponseTimelineCardProps {
  responseTimeline: number[];
}

export function ResponseTimelineCard({ responseTimeline }: ResponseTimelineCardProps) {
  const t = useTranslations('surveys.stats');

  return (
    <Card className={cn(BENTO_CARD_CLASS)}>
      <CardContent className="p-3">
        <ChartLabel>{t('responsesOverTime')}</ChartLabel>
        <ResponseTimelineChart data={responseTimeline} className="h-[180px] w-full" />
      </CardContent>
    </Card>
  );
}

// ── Completion Rate Card ─────────────────────────────────────────────

interface CompletionRateCardProps {
  completionBreakdown: { completed: number; inProgress: number; abandoned: number };
}

export function CompletionRateCard({ completionBreakdown }: CompletionRateCardProps) {
  const t = useTranslations('surveys.stats');

  return (
    <Card className={cn(BENTO_CARD_CLASS)}>
      <CardContent className="p-3">
        <ChartLabel>{t('completionRate')}</ChartLabel>
        <CompletionBarChart
          data={completionBreakdown}
          labels={{
            completed: t('charts.completed'),
            inProgress: t('charts.inProgress'),
            abandoned: t('charts.abandoned'),
          }}
          noDataMessage={t('noChartData')}
        />
      </CardContent>
    </Card>
  );
}

// ── Device Breakdown Card ────────────────────────────────────────────

interface DeviceBreakdownCardProps {
  deviceTimeline: DeviceTimelinePoint[];
}

export function DeviceBreakdownCard({ deviceTimeline }: DeviceBreakdownCardProps) {
  const t = useTranslations('surveys.stats');

  return (
    <Card className={cn(BENTO_CARD_CLASS)}>
      <CardContent className="p-3">
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

        <DeviceBreakdownChart data={deviceTimeline} className="h-40 w-full" />
      </CardContent>
    </Card>
  );
}
