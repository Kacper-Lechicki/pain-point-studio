'use client';

import { useTranslations } from 'next-intl';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { QuestionAnswerData } from '@/features/surveys/actions/get-survey-stats';

interface ChoiceDistributionChartProps {
  answers: QuestionAnswerData[];
}

export const ChoiceDistributionChart = ({ answers }: ChoiceDistributionChartProps) => {
  const t = useTranslations('surveys.stats');

  const chartConfig = {
    count: {
      label: t('chartResponses'),
      color: 'var(--color-primary)',
    },
  } satisfies ChartConfig;

  // Count selections across all answers
  const counts = new Map<string, number>();

  for (const a of answers) {
    const selected = (a.value.selected as string[]) ?? [];

    for (const option of selected) {
      counts.set(option, (counts.get(option) ?? 0) + 1);
    }

    const other = a.value.other as string | undefined;

    if (other) {
      const otherKey = `${t('otherLabel')}: ${other}`;
      counts.set(otherKey, (counts.get(otherKey) ?? 0) + 1);
    }
  }

  const data = Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('noChartData')}</p>;
  }

  return (
    <ChartContainer config={chartConfig} className="h-48 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
};
