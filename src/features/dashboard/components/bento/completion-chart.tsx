'use client';

import { useMemo } from 'react';

import { LineChart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Card, CardContent } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BENTO_CARD_CLASS } from '@/features/dashboard/components/bento/bento-styles';
import { useElementSize } from '@/features/dashboard/hooks/use-element-size';
import type { CompletionPoint } from '@/features/dashboard/types/dashboard-stats';
import { cn } from '@/lib/common/utils';

interface CompletionChartProps {
  data: CompletionPoint[];
  className?: string;
}

export const CompletionChart = ({ data, className }: CompletionChartProps) => {
  const t = useTranslations('dashboard.bento');
  const [chartContainerRef, { width: chartWidth, height: chartHeight }] =
    useElementSize<HTMLDivElement>();

  const chartConfig = {
    completion: {
      label: t('charts.completionRate'),
      color: 'var(--chart-violet)',
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
          completion: point.rate,
        };
      }),
    [data]
  );

  const hasData = data.some((point) => point.rate > 0);

  return (
    <Card className={cn(BENTO_CARD_CLASS, 'flex h-full min-w-0 flex-col')}>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 px-4 pt-4 pb-0">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t('charts.completionRate')}
          </p>
          <LineChart className="text-chart-violet size-4 shrink-0" />
        </div>

        {!hasData ? (
          <div className="text-muted-foreground flex min-h-52 flex-1 items-center justify-center text-sm">
            {t('charts.noData')}
          </div>
        ) : (
          <div ref={chartContainerRef} className="min-h-52 min-w-0 flex-1">
            {chartWidth > 0 && chartHeight > 0 && (
              <ChartContainer
                config={chartConfig}
                dimensions={{ width: chartWidth, height: chartHeight }}
                className={cn('text-xs', className)}
              >
                <AreaChart data={chartData} margin={{ left: 0, right: 4, top: 4, bottom: 4 }}>
                  <defs>
                    <linearGradient id="fillCompletion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-completion)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--color-completion)" stopOpacity={0} />
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
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value: number) => `${value}%`}
                    tickMargin={2}
                  />

                  <ChartTooltip content={<ChartTooltipContent />} />

                  <Area
                    dataKey="completion"
                    type="linear"
                    fill="url(#fillCompletion)"
                    stroke="var(--color-completion)"
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
};
