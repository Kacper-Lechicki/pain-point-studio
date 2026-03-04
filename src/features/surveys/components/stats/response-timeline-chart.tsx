'use client';

import { useTranslations } from 'next-intl';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const CHART_CONFIG = {
  responses: {
    label: 'Responses',
    color: 'var(--chart-violet)',
  },
} satisfies ChartConfig;

const CHART_MARGIN = { left: 0, right: 4, top: 4, bottom: 4 };

interface ResponseTimelineChartProps {
  data: number[];
  className?: string;
}

export const ResponseTimelineChart = ({ data, className }: ResponseTimelineChartProps) => {
  const t = useTranslations('surveys.stats');

  const chartData = (() => {
    const today = new Date();

    return data.map((count, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (data.length - 1 - i));

      return {
        date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        responses: count,
      };
    });
  })();

  const hasData = data.some((v) => v > 0);

  if (!hasData) {
    return (
      <div className="text-muted-foreground flex h-48 w-full items-center justify-center text-sm">
        {t('noChartData')}
      </div>
    );
  }

  return (
    <ChartContainer config={CHART_CONFIG} className={className ?? 'h-48 w-full'}>
      <LineChart data={chartData} margin={CHART_MARGIN}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
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
  );
};
