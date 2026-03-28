'use client';

import { useId, useMemo } from 'react';

import { LineChart as LineChartIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Area, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useElementSize } from '@/hooks/common/use-element-size';
import type { MessageKey } from '@/i18n/types';

const CHART_MARGIN = { left: 0, right: 4, top: 4, bottom: 4 };

interface OverviewResponseTrendProps {
  timeline: number[];
}

export function OverviewResponseTrend({ timeline }: OverviewResponseTrendProps) {
  const t = useTranslations();
  const gradientId = useId();
  const [chartContainerRef, { width: chartWidth, height: chartHeight }] =
    useElementSize<HTMLDivElement>();

  const chartConfig = {
    responses: {
      label: t('surveys.stats.overview.responses' as MessageKey),
      color: 'var(--chart-violet)',
    },
  } satisfies ChartConfig;

  const chartData = useMemo(() => {
    const today = new Date();

    return timeline.map((count, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (timeline.length - 1 - i));

      return {
        date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        responses: count,
      };
    });
  }, [timeline]);

  const hasData = chartData.some((point) => point.responses > 0);

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="flex min-h-0 min-w-0 flex-col gap-2 p-4">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t('surveys.stats.overview.responseTrend' as MessageKey)}
          </p>
          <LineChartIcon className="text-chart-violet size-4 shrink-0" />
        </div>

        {!hasData ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
            <LineChartIcon className="text-muted-foreground/50 size-8 shrink-0" aria-hidden />
            <p className="text-muted-foreground text-sm">
              {t('surveys.stats.overview.noTrendData' as MessageKey)}
            </p>
          </div>
        ) : (
          <div ref={chartContainerRef} className="h-[200px] min-w-0">
            {chartWidth > 0 && chartHeight > 0 ? (
              <ChartContainer
                config={chartConfig}
                dimensions={{ width: chartWidth, height: chartHeight }}
                className="text-xs"
              >
                <LineChart data={chartData} margin={CHART_MARGIN}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-responses)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="var(--color-responses)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Area
                    dataKey="responses"
                    type="linear"
                    fill={`url(#${gradientId})`}
                    stroke="none"
                  />
                  <Line
                    dataKey="responses"
                    type="linear"
                    stroke="var(--color-responses)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <Skeleton className="h-full w-full rounded-lg" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
