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
import type { DeviceTimelinePoint } from '@/features/surveys/actions/get-survey-stats';

interface DeviceBreakdownChartProps {
  /** 30-element array of daily device counts (oldest -> newest). */
  data: DeviceTimelinePoint[];
  className?: string;
}

export const DeviceBreakdownChart = ({ data, className }: DeviceBreakdownChartProps) => {
  const t = useTranslations();

  const chartConfig = {
    desktop: {
      label: t('surveys.stats.deviceDesktop'),
      color: 'var(--chart-violet)',
    },
    mobile: {
      label: t('surveys.stats.deviceMobile'),
      color: 'var(--chart-cyan)',
    },
  } satisfies ChartConfig;

  const chartData = useMemo(() => {
    const today = new Date();

    return data.map((point, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (data.length - 1 - i));

      return {
        date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        desktop: point.desktop,
        mobile: point.mobile,
      };
    });
  }, [data]);

  const hasData = data.some((p) => p.desktop > 0 || p.mobile > 0);

  if (!hasData) {
    return null;
  }

  return (
    <ChartContainer config={chartConfig} className={className ?? 'h-40 w-full'}>
      <AreaChart data={chartData} margin={{ left: 0, right: 12, top: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0} />
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
          dataKey="desktop"
          type="monotone"
          fill="url(#fillDesktop)"
          stroke="var(--color-desktop)"
          strokeWidth={2}
        />
        <Area
          dataKey="mobile"
          type="monotone"
          fill="url(#fillMobile)"
          stroke="var(--color-mobile)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
};
