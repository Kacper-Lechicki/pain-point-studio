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
  const t = useTranslations('surveys.stats');

  const chartConfig = {
    count: {
      label: t('chartResponses'),
      color: 'var(--color-primary)',
    },
  } satisfies ChartConfig;

  const { data, average } = useMemo(() => {
    const counts = new Map<number, number>();
    let sum = 0;
    let total = 0;

    for (const a of answers) {
      const rating = a.value.rating as number;

      if (typeof rating === 'number') {
        counts.set(rating, (counts.get(rating) ?? 0) + 1);
        sum += rating;
        total++;
      }
    }

    return {
      data: Array.from(counts.entries())
        .map(([rating, count]) => ({ rating: String(rating), count }))
        .sort((a, b) => Number(a.rating) - Number(b.rating)),
      average: total > 0 ? sum / total : 0,
    };
  }, [answers]);

  if (data.length === 0) {
    return <p className="text-muted-foreground text-xs">{t('noChartData')}</p>;
  }

  return (
    <div>
      <p className="text-muted-foreground mb-3 text-sm">
        {t('average', { value: average.toFixed(1) })}
      </p>
      <ChartContainer config={chartConfig} className="h-40 w-full">
        <BarChart data={data} margin={{ left: -12, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="rating" />
          <YAxis allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="var(--color-count)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
};
