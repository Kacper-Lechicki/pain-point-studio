'use client';

import { useMemo, useState } from 'react';

import { LineChart as LineChartIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

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

type TimeRange = '7d' | '30d' | '90d';

const RANGES: { value: TimeRange; days: number }[] = [
  { value: '7d', days: 7 },
  { value: '30d', days: 30 },
  { value: '90d', days: 90 },
];

interface OverviewResponseTrendProps {
  timeline: TimelinePoint[];
}

export function OverviewResponseTrend({ timeline }: OverviewResponseTrendProps) {
  const t = useTranslations();
  const [range, setRange] = useState<TimeRange>('30d');
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
      <CardContent className="flex min-h-0 min-w-0 flex-col gap-2 p-4">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t('projects.overview.responseTrend' as MessageKey)}
          </p>

          <div className="flex items-center gap-4">
            {/* Mini time range control (matches dashboard pill style) */}
            <div className="border-border/50 bg-card flex items-center gap-0.5 rounded-md border p-0.5 shadow-sm">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRange(r.value)}
                  className={cn(
                    'rounded-md border px-1.5 py-0.5 text-[10px] leading-none font-medium transition-colors',
                    range === r.value
                      ? 'bg-primary text-primary-foreground border-transparent shadow-sm'
                      : 'text-muted-foreground hover:text-foreground border-transparent'
                  )}
                >
                  {r.value}
                </button>
              ))}
            </div>

            <LineChartIcon className="text-chart-violet size-4 shrink-0" />
          </div>
        </div>

        {/* Chart */}
        {!hasData ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
            <LineChartIcon className="text-muted-foreground/50 size-8 shrink-0" aria-hidden />
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
      </CardContent>
    </Card>
  );
}
