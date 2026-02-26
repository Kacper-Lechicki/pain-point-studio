'use client';

import { useMemo } from 'react';

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

interface OverviewSurveyStatusChartProps {
  data: Record<string, number>;
}

export function OverviewSurveyStatusChart({ data }: OverviewSurveyStatusChartProps) {
  const t = useTranslations('projects.detail.charts');
  const [chartContainerRef, { width: chartWidth, height: chartHeight }] =
    useElementSize<HTMLDivElement>();

  const chartConfig = {
    count: {
      label: t('surveyStatus'),
    },
    draft: {
      label: t('draft'),
      color: 'var(--chart-purple)',
    },
    active: {
      label: t('active'),
      color: 'var(--chart-emerald)',
    },
    completed: {
      label: t('completedStatus'),
      color: 'var(--chart-cyan)',
    },
  } satisfies ChartConfig;

  const chartData = useMemo(
    () => [
      { status: t('draft'), count: data.draft ?? 0, fill: 'var(--chart-purple)' },
      { status: t('active'), count: data.active ?? 0, fill: 'var(--chart-emerald)' },
      { status: t('completedStatus'), count: data.completed ?? 0, fill: 'var(--chart-cyan)' },
    ],
    [data, t]
  );

  const hasData = chartData.some((d) => d.count > 0);

  return (
    <Card className="flex h-full min-w-0 flex-col">
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 px-4 pt-4 pb-0">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            {t('surveyStatus')}
          </p>
          <BarChart3 className="text-chart-purple size-4 shrink-0" />
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
                <BarChart data={chartData} margin={{ left: 0, right: 4, top: 4, bottom: 4 }}>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    className="stroke-border/40"
                  />

                  <XAxis
                    dataKey="status"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    dy={2}
                  />

                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                    tick={{ fontSize: 11 }}
                    tickMargin={2}
                  />

                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />

                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
