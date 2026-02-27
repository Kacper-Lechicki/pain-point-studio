'use client';

import { useMemo, useState } from 'react';

import { BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Card, CardContent } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useElementSize } from '@/features/dashboard/hooks/use-element-size';
import type { TimelinePoint } from '@/features/dashboard/types/dashboard-stats';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

const CHART_MARGIN = { left: 0, right: 4, top: 4, bottom: 4 };

type TimeRange = '7d' | '14d' | '30d';

const RANGES: { value: TimeRange; days: number }[] = [
  { value: '7d', days: 7 },
  { value: '14d', days: 14 },
  { value: '30d', days: 30 },
];

interface OverviewResponseTrendProps {
  timeline: TimelinePoint[];
}

export function OverviewResponseTrend({ timeline }: OverviewResponseTrendProps) {
  const t = useTranslations();
  const [range, setRange] = useState<TimeRange>('14d');
  const [chartContainerRef, { width: chartWidth, height: chartHeight }] =
    useElementSize<HTMLDivElement>();

  const chartConfig = {
    responses: {
      label: t('projects.overview.responses' as MessageKey),
      color: 'var(--chart-violet)',
    },
  } satisfies ChartConfig;

  const chartData = useMemo(() => {
    const days = RANGES.find((r) => r.value === range)!.days;
    const sliced = timeline.slice(-days);

    return sliced.map((point) => {
      const dateStr = point.date.substring(0, 10);
      const [y, m, d] = dateStr.split('-');
      const date = new Date(Number(y), Number(m) - 1, Number(d));

      return {
        date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        responses: point.count,
      };
    });
  }, [timeline, range]);

  const hasData = chartData.some((point) => point.responses > 0);

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="flex min-h-0 flex-col gap-2 p-4">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t('projects.overview.responseTrend' as MessageKey)}
          </p>

          <div className="flex items-center gap-0.5 rounded-md border p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                className={cn(
                  'rounded px-2 py-0.5 text-xs font-medium transition-colors',
                  range === r.value
                    ? 'bg-foreground/10 text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {r.value}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        {!hasData ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
            <BarChart3 className="text-muted-foreground/50 size-8 shrink-0" aria-hidden />
            <p className="text-muted-foreground text-sm">
              {t('projects.overview.noResponses' as MessageKey)}
            </p>
          </div>
        ) : (
          <div ref={chartContainerRef} className="h-[200px] min-w-0">
            {chartWidth > 0 && chartHeight > 0 && (
              <ChartContainer
                config={chartConfig}
                dimensions={{ width: chartWidth, height: chartHeight }}
                className="text-xs"
              >
                <BarChart data={chartData} margin={CHART_MARGIN}>
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
                  <Bar dataKey="responses" fill="var(--color-responses)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
