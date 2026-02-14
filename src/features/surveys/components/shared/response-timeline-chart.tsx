'use client';

import { useMemo } from 'react';

import { useTranslations } from 'next-intl';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface ResponseTimelineChartProps {
  /** 30-element array of daily response counts (oldest → newest). */
  data: number[];
  className?: string;
}

export const ResponseTimelineChart = ({ data, className }: ResponseTimelineChartProps) => {
  const t = useTranslations('surveys.stats');

  const chartConfig = {
    responses: {
      label: t('chartResponses'),
      color: 'var(--chart-emerald)',
    },
  } satisfies ChartConfig;

  const chartData = useMemo(() => {
    const today = new Date();

    return data.map((count, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (data.length - 1 - i));

      return {
        date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        responses: count,
      };
    });
  }, [data]);

  const hasData = data.some((v) => v > 0);

  if (!hasData) {
    return null;
  }

  return (
    <ChartContainer config={chartConfig} className={className ?? 'h-40 w-full'}>
      <AreaChart data={chartData} margin={{ left: 0, right: 12, top: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="fillResponses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-responses)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-responses)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          interval="preserveStartEnd"
          minTickGap={40}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={28}
          tick={{ fontSize: 11 }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="responses"
          type="monotone"
          fill="url(#fillResponses)"
          stroke="var(--color-responses)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
};
