'use client';

import { useMemo } from 'react';

import { useTranslations } from 'next-intl';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { SectionLabel } from '@/components/ui/metric-display';
import { useElementSize } from '@/features/dashboard/hooks/use-element-size';
import type { TimelinePoint } from '@/features/dashboard/types/dashboard-stats';

const CHART_CONFIG = {
  responses: {
    label: 'Responses',
    color: 'var(--chart-cyan)',
  },
} satisfies ChartConfig;

const CHART_MARGIN = { left: 0, right: 4, top: 4, bottom: 4 };

interface OverviewResponseTimelineProps {
  data: TimelinePoint[];
}

export function OverviewResponseTimeline({ data }: OverviewResponseTimelineProps) {
  const t = useTranslations('projects.detail.charts');
  const [chartContainerRef, { width: chartWidth, height: chartHeight }] =
    useElementSize<HTMLDivElement>();

  const chartData = useMemo(
    () =>
      data.map((point) => {
        const dateStr = point.date.substring(0, 10);
        const [y, m, d] = dateStr.split('-');
        const date = new Date(Number(y), Number(m) - 1, Number(d));

        return {
          date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          responses: point.count,
        };
      }),
    [data]
  );

  const hasData = data.some((point) => point.count > 0);

  return (
    <div>
      <SectionLabel>{t('responseTimeline')}</SectionLabel>
      {!hasData ? (
        <div className="text-muted-foreground flex h-48 w-full items-center justify-center text-sm">
          {t('noData')}
        </div>
      ) : (
        <div ref={chartContainerRef} className="h-48 w-full min-w-0">
          {chartWidth > 0 && chartHeight > 0 && (
            <ChartContainer
              config={CHART_CONFIG}
              dimensions={{ width: chartWidth, height: chartHeight }}
              className="text-xs"
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
                  dataKey="responses"
                  type="linear"
                  stroke="var(--color-responses)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>
      )}
    </div>
  );
}
