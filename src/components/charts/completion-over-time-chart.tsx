'use client';

import { useMemo } from 'react';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useElementSize } from '@/features/dashboard/hooks/use-element-size';
import type { CompletionTimelinePoint } from '@/features/projects/types';
import { cn } from '@/lib/common/utils';

/** Same margins and axis style as response timeline for consistency. */
const CHART_MARGIN = { left: 0, right: 4, top: 4, bottom: 4 };

const CHART_CONFIG = {
  completed: {
    label: 'Completed',
    color: 'var(--chart-emerald)',
  },
  inProgress: {
    label: 'In progress',
    color: 'var(--chart-cyan)',
  },
  abandoned: {
    label: 'Abandoned',
    color: 'var(--chart-rose)',
  },
} satisfies ChartConfig;

interface CompletionOverTimeChartProps {
  data: CompletionTimelinePoint[];
  /** Section label text (e.g. "Completion rate"); if not provided, no label. */
  label?: string;
  /** No-data message. */
  noDataMessage?: string;
  className?: string;
  /** When set (e.g. from parent useElementSize), chart uses these dimensions and fills container. */
  dimensions?: { width: number; height: number };
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.substring(0, 10).split('-');
  const date = new Date(Number(y), Number(m) - 1, Number(d));

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function CompletionOverTimeChart({
  data,
  label,
  noDataMessage = 'No data available',
  className,
  dimensions: dimensionsProp,
}: CompletionOverTimeChartProps) {
  const [chartContainerRef, { width: sizeW, height: sizeH }] = useElementSize<HTMLDivElement>();
  const chartWidth = dimensionsProp?.width ?? sizeW;
  const chartHeight = dimensionsProp?.height ?? sizeH;

  const chartData = useMemo(
    () =>
      data.map((point) => ({
        date: formatDateLabel(point.date),
        completed: point.completed,
        inProgress: point.inProgress,
        abandoned: point.abandoned,
      })),
    [data]
  );

  const hasData = data.some((p) => p.completed > 0 || p.inProgress > 0 || p.abandoned > 0);

  if (!hasData) {
    return (
      <div className={className}>
        {label != null && (
          <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wider uppercase">
            {label}
          </p>
        )}
        <div
          className={cn(
            'text-muted-foreground flex w-full items-center justify-center text-sm',
            dimensionsProp ? 'h-full min-h-52' : 'h-48'
          )}
        >
          {noDataMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {label != null && (
        <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wider uppercase">
          {label}
        </p>
      )}
      <div
        ref={chartContainerRef}
        className={dimensionsProp ? 'h-full min-h-0 min-w-0 flex-1' : 'h-48 w-full min-w-0'}
      >
        {chartWidth > 0 && chartHeight > 0 && (
          <ChartContainer
            config={CHART_CONFIG}
            dimensions={{ width: chartWidth, height: chartHeight }}
            className="text-xs"
          >
            <AreaChart data={chartData} margin={CHART_MARGIN}>
              <defs>
                <linearGradient id="fillCompletionCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-emerald)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--chart-emerald)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillCompletionInProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-cyan)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--chart-cyan)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillCompletionAbandoned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-rose)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--chart-rose)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
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
                type="linear"
                dataKey="completed"
                stackId="1"
                fill="url(#fillCompletionCompleted)"
                stroke="var(--chart-emerald)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: 'var(--background)', strokeWidth: 2 }}
              />
              <Area
                type="linear"
                dataKey="inProgress"
                stackId="1"
                fill="url(#fillCompletionInProgress)"
                stroke="var(--chart-cyan)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: 'var(--background)', strokeWidth: 2 }}
              />
              <Area
                type="linear"
                dataKey="abandoned"
                stackId="1"
                fill="url(#fillCompletionAbandoned)"
                stroke="var(--chart-rose)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: 'var(--background)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}
