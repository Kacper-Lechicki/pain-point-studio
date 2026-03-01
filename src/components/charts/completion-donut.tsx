'use client';

import { useMemo } from 'react';

import { Cell, Pie, PieChart } from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useElementSize } from '@/features/dashboard/hooks/use-element-size';
import { cn } from '@/lib/common/utils';

const SEGMENT_COLORS = {
  completed: 'var(--chart-emerald)',
  inProgress: 'var(--chart-cyan)',
  abandoned: 'var(--chart-rose)',
} as const;

export interface CompletionDonutData {
  completed: number;
  inProgress: number;
  abandoned: number;
}

const CHART_CONFIG = {
  completed: { label: 'Completed', color: SEGMENT_COLORS.completed },
  inProgress: { label: 'In progress', color: SEGMENT_COLORS.inProgress },
  abandoned: { label: 'Abandoned', color: SEGMENT_COLORS.abandoned },
} satisfies ChartConfig;

interface CompletionDonutProps {
  data: CompletionDonutData;
  /** Optional label above the donut */
  label?: string;
  /** No-data message */
  noDataMessage?: string;
  className?: string;
  /** When set, chart uses these dimensions (e.g. from parent useElementSize). */
  dimensions?: { width: number; height: number };
}

export function CompletionDonut({
  data,
  label,
  noDataMessage = 'No data',
  className,
  dimensions: dimensionsProp,
}: CompletionDonutProps) {
  const [containerRef, { width: sizeW, height: sizeH }] = useElementSize<HTMLDivElement>();
  const width = dimensionsProp?.width ?? sizeW;
  const height = dimensionsProp?.height ?? sizeH;

  const chartData = useMemo(
    () => [
      { name: 'completed', value: data.completed, fill: SEGMENT_COLORS.completed },
      { name: 'inProgress', value: data.inProgress, fill: SEGMENT_COLORS.inProgress },
      { name: 'abandoned', value: data.abandoned, fill: SEGMENT_COLORS.abandoned },
    ],
    [data]
  );

  const total = data.completed + data.inProgress + data.abandoned;
  const hasData = total > 0;

  const size = Math.min(width, height, 160);
  const outerRadius = Math.max(size / 2 - 8, 24);
  const innerRadius = outerRadius * 0.6;

  if (!hasData) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
        {label != null && (
          <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            {label}
          </p>
        )}
        <p className="text-muted-foreground text-sm">{noDataMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {label != null && (
        <p className="text-muted-foreground w-full text-[11px] font-medium tracking-wider uppercase">
          {label}
        </p>
      )}
      <div
        ref={containerRef}
        className={cn('min-h-0 w-full min-w-0 flex-1', !dimensionsProp && 'min-h-[140px]')}
        style={
          dimensionsProp
            ? { width: dimensionsProp.width, height: dimensionsProp.height }
            : undefined
        }
      >
        {width > 0 && height > 0 && (
          <ChartContainer
            config={CHART_CONFIG}
            dimensions={dimensionsProp ?? { width, height }}
            className="text-xs"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={outerRadius}
                innerRadius={innerRadius}
                strokeWidth={2}
                stroke="var(--background)"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {chartData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: entry.fill }}
              aria-hidden
            />
            <span className="text-muted-foreground text-[11px]">
              {CHART_CONFIG[entry.name as keyof typeof CHART_CONFIG].label} ({entry.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
