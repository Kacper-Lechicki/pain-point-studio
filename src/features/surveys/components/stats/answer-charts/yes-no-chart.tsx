'use client';

import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Cell, Pie, PieChart } from 'recharts';

import { type ChartConfig, ChartContainer } from '@/components/ui/chart';
import type { QuestionAnswerData } from '@/features/surveys/actions/get-survey-stats';
import { cn } from '@/lib/common/utils';

interface YesNoChartProps {
  answers: QuestionAnswerData[];
}

export const YesNoChart = ({ answers }: YesNoChartProps) => {
  const t = useTranslations();

  const yesCount = answers.filter((a) => a.value.answer === true).length;
  const noCount = answers.filter((a) => a.value.answer === false).length;
  const total = yesCount + noCount;

  if (total === 0) {
    return <p className="text-muted-foreground text-xs">{t('surveys.stats.noChartData')}</p>;
  }

  const yesPercentage = Math.round((yesCount / total) * 100);
  const noPercentage = 100 - yesPercentage;
  const majorityYes = yesCount >= noCount;

  const chartConfig = {
    yes: { label: t('surveys.stats.yesLabel'), color: 'var(--chart-emerald)' },
    no: { label: t('surveys.stats.noLabel'), color: 'var(--chart-rose)' },
  } satisfies ChartConfig;

  const pieData = [
    { name: 'yes', value: yesCount },
    { name: 'no', value: noCount },
  ];

  const COLORS = ['var(--chart-emerald)', 'var(--chart-rose)'];

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-xs font-medium">
        {majorityYes
          ? t('surveys.stats.majorityYes', { pct: yesPercentage })
          : t('surveys.stats.majorityNo', { pct: noPercentage })}
      </p>

      <div className="flex items-center gap-6">
        <ChartContainer config={chartConfig} className="size-28 shrink-0">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="85%"
              strokeWidth={0}
            >
              {pieData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index]} />
              ))}
            </Pie>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-foreground text-lg font-bold"
            >
              {majorityYes ? `${yesPercentage}%` : `${noPercentage}%`}
            </text>
          </PieChart>
        </ChartContainer>

        <div className="flex-1 space-y-3">
          <div className="bg-muted/60 flex h-9 overflow-hidden rounded-full">
            {yesPercentage > 0 && (
              <div
                className="flex items-center justify-center gap-1 text-xs font-semibold text-white transition-all"
                style={{ width: `${yesPercentage}%`, backgroundColor: 'var(--chart-emerald)' }}
              >
                {yesPercentage > 12 && (
                  <>
                    <Check className="size-3.5 shrink-0" aria-hidden />
                    {yesPercentage > 20 && `${yesPercentage}%`}
                  </>
                )}
              </div>
            )}
            {noPercentage > 0 && (
              <div
                className="flex items-center justify-center gap-1 text-xs font-semibold text-white transition-all"
                style={{ width: `${noPercentage}%`, backgroundColor: 'var(--chart-rose)' }}
              >
                {noPercentage > 12 && (
                  <>
                    <X className="size-3.5 shrink-0" aria-hidden />
                    {noPercentage > 20 && `${noPercentage}%`}
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-between gap-4">
            <span
              className={cn(
                'flex items-center gap-2 text-sm font-medium',
                majorityYes ? 'text-[var(--chart-emerald)]' : 'text-muted-foreground'
              )}
            >
              <Check className="size-4 shrink-0" aria-hidden />
              {t('surveys.stats.yesLabel')}: {yesCount}
              <span className="text-muted-foreground font-normal">({yesPercentage}%)</span>
            </span>
            <span
              className={cn(
                'flex items-center gap-2 text-sm font-medium',
                !majorityYes ? 'text-[var(--chart-rose)]' : 'text-muted-foreground'
              )}
            >
              <X className="size-4 shrink-0" aria-hidden />
              {t('surveys.stats.noLabel')}: {noCount}
              <span className="text-muted-foreground font-normal">({noPercentage}%)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
