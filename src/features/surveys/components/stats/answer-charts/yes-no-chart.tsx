'use client';

import { useTranslations } from 'next-intl';

import type { QuestionAnswerData } from '@/features/surveys/actions/get-survey-stats';

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

  return (
    <div className="space-y-3">
      <div className="flex h-8 overflow-hidden rounded-full">
        {yesPercentage > 0 && (
          <div
            className="bg-success flex items-center justify-center text-xs font-medium text-white transition-all"
            style={{ width: `${yesPercentage}%` }}
          >
            {yesPercentage > 15 && `${yesPercentage}%`}
          </div>
        )}
        {noPercentage > 0 && (
          <div
            className="bg-destructive flex items-center justify-center text-xs font-medium text-white transition-all"
            style={{ width: `${noPercentage}%` }}
          >
            {noPercentage > 15 && `${noPercentage}%`}
          </div>
        )}
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-success flex items-center gap-1.5">
          {t('yesLabel')}: {yesCount} ({yesPercentage}%)
        </span>
        <span className="text-destructive flex items-center gap-1.5">
          {t('noLabel')}: {noCount} ({noPercentage}%)
        </span>
      </div>
    </div>
  );
};
