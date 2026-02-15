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

interface CategoryBreakdownChartProps {
  data: { category: string; count: number; totalResponses: number }[];
}

export const CategoryBreakdownChart = ({ data }: CategoryBreakdownChartProps) => {
  const t = useTranslations();
  const tCategories = useTranslations();

  const chartConfig = {
    totalResponses: {
      label: t('analytics.responses'),
      color: 'var(--chart-choice)',
    },
  } satisfies ChartConfig;

  const chartData = useMemo(
    () =>
      data
        .map((d) => ({
          category: translateCategory(d.category, tCategories),
          totalResponses: d.totalResponses,
          count: d.count,
        }))
        .sort((a, b) => b.totalResponses - a.totalResponses),
    [data, tCategories]
  );

  if (chartData.length === 0) {
    return null;
  }

  return (
    <ChartContainer config={chartConfig} className="h-48 w-full">
      <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 12 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey="category" width={120} tick={{ fontSize: 12 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="totalResponses" fill="var(--color-totalResponses)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
};

function translateCategory(
  category: string,
  tCategories: ReturnType<typeof useTranslations>
): string {
  try {
    return tCategories(`surveys.categories.${category}` as Parameters<typeof tCategories>[0]);
  } catch {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
}
