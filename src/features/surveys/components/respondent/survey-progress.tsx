'use client';

import { useTranslations } from 'next-intl';

interface SurveyProgressProps {
  current: number;
  total: number;
}

export const SurveyProgress = ({ current, total }: SurveyProgressProps) => {
  const t = useTranslations();
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-muted-foreground text-xs">
          {t('respondent.flow.questionOf', { current, total })}
        </span>
        <span className="text-muted-foreground text-xs">{percentage}%</span>
      </div>
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
