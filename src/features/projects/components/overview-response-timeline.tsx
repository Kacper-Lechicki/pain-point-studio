'use client';

import { useMemo } from 'react';

import { BarChart2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Card, CardContent } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useElementSize } from '@/features/dashboard/hooks/use-element-size';
import type { TimelinePoint } from '@/features/dashboard/types/dashboard-stats';

interface OverviewResponseTimelineProps {
  data: TimelinePoint[];
}

export function OverviewResponseTimeline({ data }: OverviewResponseTimelineProps) {
  const t = useTranslations('projects.detail.charts');
  const [chartContainerRef, { width: chartWidth, height: chartHeight }] =
    useElementSize<HTMLDivElement>();

  const chartConfig = {
    responses: {
      label: t('responses'),
      color: 'var(--chart-cyan)',
    },
  } satisfies ChartConfig;

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
    <Card className="flex h-full min-w-0 flex-col">
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 px-4 pt-4 pb-0">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            {t('responseTimeline')}
          </p>
          <BarChart2 className="text-chart-cyan size-4 shrink-0" />
        </div>

        {!hasData ? (
          <div className="text-muted-foreground flex min-h-52 flex-1 items-center justify-center text-sm">
            {t('noData')}
          </div>
        ) : (
          <div ref={chartContainerRef} className="min-h-52 min-w-0 flex-1">
            {chartWidth > 0 && chartHeight > 0 && (
              <ChartContainer
                config={chartConfig}
                dimensions={{ width: chartWidth, height: chartHeight }}
                className="text-xs"
              >
                <AreaChart data={chartData} margin={{ left: 0, right: 4, top: 4, bottom: 4 }}>
                  <defs>
                    <linearGradient id="fillProjectResponses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-responses)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--color-responses)" stopOpacity={0} />
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
                    minTickGap={40}
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
                    fill="url(#fillProjectResponses)"
                    stroke="var(--color-responses)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, stroke: 'var(--background)', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
