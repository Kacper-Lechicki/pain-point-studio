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

interface ChoiceDistributionChartProps {
  answers: QuestionAnswerData[];
}

export const ChoiceDistributionChart = ({ answers }: ChoiceDistributionChartProps) => {
  const t = useTranslations();

  const chartConfig = {
    count: {
      label: t('surveys.stats.chartResponses'),
      color: 'var(--chart-choice)',
    },
  } satisfies ChartConfig;

  const { data, total, respondentCount } = useMemo(() => {
    const counts = new Map<string, number>();

    for (const a of answers) {
      const selected = (a.value.selected as string[]) ?? [];

      for (const option of selected) {
        counts.set(option, (counts.get(option) ?? 0) + 1);
      }

      const other = a.value.other as string | undefined;

      if (other) {
        const otherKey = `${t('surveys.stats.otherLabel')}: ${other}`;
        counts.set(otherKey, (counts.get(otherKey) ?? 0) + 1);
      }
    }

    const arr = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    const sum = arr.reduce((s, d) => s + d.count, 0);

    return { data: arr, total: sum, respondentCount: answers.length };
  }, [answers, t]);

  if (data.length === 0) {
    return <p className="text-muted-foreground text-xs">{t('surveys.stats.noChartData')}</p>;
  }

  const showSelectionsFromRespondents = total > respondentCount;

  const formatCountWithPercent = (value: unknown) => {
    const n = typeof value === 'number' ? value : 0;

    return total > 0 ? `${n} (${Math.round((n / total) * 100)}%)` : String(n);
  };

  return (
    <div>
      {showSelectionsFromRespondents && (
        <p className="text-muted-foreground mb-2 text-[11px]">
          {t('surveys.stats.totalSelectionsFromRespondents', {
            selections: total,
            respondents: respondentCount,
          })}
        </p>
      )}
      <ChartContainer config={chartConfig} className="h-48 w-full">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => formatCountWithPercent(value) as React.ReactNode}
              />
            }
          />
          <Bar dataKey="count" fill="var(--color-count)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
};
