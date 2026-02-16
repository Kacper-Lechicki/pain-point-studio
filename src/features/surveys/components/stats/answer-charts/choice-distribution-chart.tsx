'use client';

import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import type { QuestionAnswerData } from '@/features/surveys/actions/get-survey-stats';
import { cn } from '@/lib/common/utils';

interface ChoiceDistributionChartProps {
  answers: QuestionAnswerData[];
}

export const ChoiceDistributionChart = ({ answers }: ChoiceDistributionChartProps) => {
  const t = useTranslations();

  const { rows, total, respondentCount } = useMemo(() => {
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

    return { rows: arr, total: sum, respondentCount: answers.length };
  }, [answers, t]);

  if (rows.length === 0) {
    return <p className="text-muted-foreground text-xs">{t('surveys.stats.noChartData')}</p>;
  }

  const maxCount = rows[0]!.count;
  const isMultiSelect = total > respondentCount;

  return (
    <div className="space-y-3">
      {/* Multi-select note */}
      {isMultiSelect && (
        <p className="text-muted-foreground text-[11px]">
          {t('surveys.stats.totalSelectionsFromRespondents', {
            selections: total,
            respondents: respondentCount,
          })}
        </p>
      )}

      {/* Horizontal progress bars */}
      <div className="space-y-2">
        {rows.map((row, i) => {
          const pct = Math.round((row.count / total) * 100);
          const barWidth = maxCount > 0 ? (row.count / maxCount) * 100 : 0;
          const isTop = i === 0;

          return (
            <div key={row.name} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    'min-w-0 truncate text-xs',
                    isTop ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                  title={row.name}
                >
                  {row.name}
                </span>
                <span className="text-foreground shrink-0 text-xs font-medium tabular-nums">
                  {row.count} <span className="text-muted-foreground font-normal">({pct}%)</span>
                </span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isTop ? 'bg-cyan-500' : 'bg-cyan-500/30'
                  )}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
