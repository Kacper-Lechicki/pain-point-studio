'use client';

import { useMemo } from 'react';

import { TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BENTO_CARD_CLASS,
  BENTO_EMPTY_STATE_MIN_H,
} from '@/features/dashboard/components/bento/bento-styles';
import { useElementSize } from '@/features/dashboard/hooks/use-element-size';
import type { CompletionTimelinePoint } from '@/features/projects/types';
import { cn } from '@/lib/common/utils';

const CHART_MARGIN = { left: 0, right: 4, top: 4, bottom: 4 };

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.substring(0, 10).split('-');
  const date = new Date(Number(y), Number(m) - 1, Number(d));

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface CompletionOverTimeCardProps {
  data: CompletionTimelinePoint[];
  className?: string;
}

export function CompletionOverTimeCard({ data, className }: CompletionOverTimeCardProps) {
  const t = useTranslations('dashboard.bento');
  const [chartContainerRef, { width: chartWidth, height: chartHeight }] =
    useElementSize<HTMLDivElement>();

  const chartConfig = {
    formEntries: {
      label: t('charts.surveyEntriesOverTime'),
      color: 'var(--chart-violet)',
    },
  } satisfies ChartConfig;

  const chartData = useMemo(
    () =>
      data.map((point) => ({
        date: formatDateLabel(point.date),
        formEntries: point.completed + point.inProgress + point.abandoned,
      })),
    [data]
  );

  const hasData = data.some((p) => p.completed > 0 || p.inProgress > 0 || p.abandoned > 0);

  return (
    <Card className={cn(BENTO_CARD_CLASS, 'flex h-full min-w-0 flex-col', className)}>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 p-4">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t('charts.surveyEntriesOverTime')}
          </p>
          <TrendingUp className="text-chart-violet size-4 shrink-0" aria-hidden />
        </div>

        {!hasData ? (
          <div
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-2 text-center',
              BENTO_EMPTY_STATE_MIN_H
            )}
          >
            <TrendingUp className="text-muted-foreground/50 size-8 shrink-0" aria-hidden />
            <p className="text-muted-foreground text-sm">{t('charts.noData')}</p>
          </div>
        ) : (
          <div ref={chartContainerRef} className={cn('min-w-0 flex-1', BENTO_EMPTY_STATE_MIN_H)}>
            {chartWidth > 0 && chartHeight > 0 && (
              <ChartContainer
                config={chartConfig}
                dimensions={{ width: chartWidth, height: chartHeight }}
                className={cn('text-xs', className)}
              >
                <LineChart data={chartData} margin={CHART_MARGIN}>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    className="stroke-border/40"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                    minTickGap={32}
                    dy={2}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                    tick={{ fontSize: 11 }}
                    tickMargin={2}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    dataKey="formEntries"
                    type="linear"
                    stroke="var(--color-formEntries)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
