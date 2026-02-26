'use client';

import { useMemo } from 'react';

import { PieChartIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Cell, Pie, PieChart } from 'recharts';

import { Card, CardContent } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useElementSize } from '@/features/dashboard/hooks/use-element-size';

interface OverviewCompletionRingProps {
  data: {
    completed: number;
    inProgress: number;
    abandoned: number;
  };
}

const SEGMENT_COLORS = {
  completed: 'var(--chart-emerald)',
  inProgress: 'var(--chart-cyan)',
  abandoned: 'var(--chart-rose)',
} as const;

export function OverviewCompletionRing({ data }: OverviewCompletionRingProps) {
  const t = useTranslations('projects.detail.charts');
  const [chartContainerRef, { width: chartWidth, height: chartHeight }] =
    useElementSize<HTMLDivElement>();

  const chartConfig = {
    completed: {
      label: t('completed'),
      color: SEGMENT_COLORS.completed,
    },
    inProgress: {
      label: t('inProgress'),
      color: SEGMENT_COLORS.inProgress,
    },
    abandoned: {
      label: t('abandoned'),
      color: SEGMENT_COLORS.abandoned,
    },
  } satisfies ChartConfig;

  const chartData = useMemo(
    () => [
      { name: t('completed'), value: data.completed, fill: SEGMENT_COLORS.completed },
      { name: t('inProgress'), value: data.inProgress, fill: SEGMENT_COLORS.inProgress },
      { name: t('abandoned'), value: data.abandoned, fill: SEGMENT_COLORS.abandoned },
    ],
    [data, t]
  );

  const total = data.completed + data.inProgress + data.abandoned;
  const hasData = total > 0;

  const size = Math.min(chartWidth, chartHeight);
  const outerRadius = Math.max(size / 2 - 8, 30);
  const innerRadius = outerRadius * 0.6;

  return (
    <Card className="flex h-full min-w-0 flex-col">
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 px-4 pt-4 pb-4">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            {t('completionRate')}
          </p>
          <PieChartIcon className="text-chart-emerald size-4 shrink-0" />
        </div>

        {!hasData ? (
          <div className="text-muted-foreground flex min-h-52 flex-1 items-center justify-center text-sm">
            {t('noData')}
          </div>
        ) : (
          <div className="flex min-h-52 flex-1 flex-col items-center gap-3">
            <div ref={chartContainerRef} className="min-h-0 min-w-0 flex-1 self-stretch">
              {chartWidth > 0 && chartHeight > 0 && (
                <ChartContainer
                  config={chartConfig}
                  dimensions={{ width: chartWidth, height: chartHeight }}
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
                  <span className="size-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                  <span className="text-muted-foreground text-[11px]">
                    {entry.name} ({entry.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
