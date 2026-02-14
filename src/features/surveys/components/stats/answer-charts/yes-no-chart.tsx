'use client';

import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { QuestionAnswerData } from '@/features/surveys/actions/get-survey-stats';
import { cn } from '@/lib/common/utils';

interface YesNoChartProps {
  answers: QuestionAnswerData[];
}

export const YesNoChart = ({ answers }: YesNoChartProps) => {
  const t = useTranslations('surveys.stats');

  const yesCount = answers.filter((a) => a.value.answer === true).length;
  const noCount = answers.filter((a) => a.value.answer === false).length;
  const total = yesCount + noCount;

  if (total === 0) {
    return <p className="text-muted-foreground text-xs">{t('noChartData')}</p>;
  }

  const yesPercentage = Math.round((yesCount / total) * 100);
  const noPercentage = 100 - yesPercentage;
  const majorityYes = yesCount >= noCount;

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-xs font-medium">
        {majorityYes
          ? t('majorityYes', { pct: yesPercentage })
          : t('majorityNo', { pct: noPercentage })}
      </p>
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
          {t('yesLabel')}: {yesCount}
          <span className="text-muted-foreground font-normal">({yesPercentage}%)</span>
        </span>
        <span
          className={cn(
            'flex items-center gap-2 text-sm font-medium',
            !majorityYes ? 'text-[var(--chart-rose)]' : 'text-muted-foreground'
          )}
        >
          <X className="size-4 shrink-0" aria-hidden />
          {t('noLabel')}: {noCount}
          <span className="text-muted-foreground font-normal">({noPercentage}%)</span>
        </span>
      </div>
    </div>
  );
};
