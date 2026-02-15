'use client';

import { useMemo } from 'react';

import { useTranslations } from 'next-intl';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { QuestionAnswerData } from '@/features/surveys/actions/get-survey-stats';

interface RatingDistributionChartProps {
  answers: QuestionAnswerData[];
}

export const RatingDistributionChart = ({ answers }: RatingDistributionChartProps) => {
  const t = useTranslations();

  const chartConfig = {
    count: {
      label: t('surveys.stats.chartResponses'),
      color: 'var(--chart-rating)',
    },
  } satisfies ChartConfig;

  const { data, average, median, min, max, mode } = useMemo(() => {
    const counts = new Map<number, number>();
    const values: number[] = [];
    let sum = 0;

    for (const a of answers) {
      const rating = a.value.rating as number;

      if (typeof rating === 'number') {
        counts.set(rating, (counts.get(rating) ?? 0) + 1);
        sum += rating;
        values.push(rating);
      }
    }

    values.sort((a, b) => a - b);
    const n = values.length;
    const mid = Math.floor(n / 2);
    const medianValue =
      n === 0 ? 0 : n % 2 === 0 ? (values[mid - 1]! + values[mid]!) / 2 : values[mid]!;
    const minVal = n === 0 ? 0 : values[0]!;
    const maxVal = n === 0 ? 0 : values[n - 1]!;

    let modeValue = 0;
    let maxCount = 0;

    for (const [r, c] of counts.entries()) {
      if (c > maxCount) {
        maxCount = c;
        modeValue = r;
      }
    }

    const scaleMin = 1;
    const scaleMax = maxVal;
    const chartData: { rating: string; count: number }[] = [];

    for (let r = scaleMin; r <= scaleMax; r++) {
      chartData.push({ rating: String(r), count: counts.get(r) ?? 0 });
    }

    return {
      data: chartData,
      average: n > 0 ? sum / n : 0,
      median: medianValue,
      min: minVal,
      max: maxVal,
      mode: modeValue,
    };
  }, [answers]);

  if (data.length === 0) {
    return <p className="text-muted-foreground text-xs">{t('surveys.stats.noChartData')}</p>;
  }

  const showRange = min !== max;

  return (
    <div className="space-y-4">
      <div className="text-muted-foreground flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span>{t('surveys.stats.average', { value: average.toFixed(1) })}</span>
        {median !== average && (
          <span>{t('surveys.stats.median', { value: median.toFixed(1) })}</span>
        )}
        {showRange && <span>{t('surveys.stats.minMax', { min, max })}</span>}
        <span>{t('surveys.stats.mode', { value: mode })}</span>
      </div>

      <ChartContainer config={chartConfig} className="h-36 w-full">
        <BarChart data={data} margin={{ left: 0, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="rating" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={28}
            tick={{ fontSize: 11 }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="var(--color-count)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
};
