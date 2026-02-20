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
  const majorityYes = yesCount > noCount;
  const isEqual = yesCount === noCount;
  const majorityPct = isEqual ? 50 : majorityYes ? yesPercentage : noPercentage;
  const ringSize = 72;
  const strokeWidth = 5;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const yesArc = circumference * (yesCount / total);

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: ringSize, height: ringSize }}>
        <svg
          width={ringSize}
          height={ringSize}
          viewBox={`0 0 ${ringSize} ${ringSize}`}
          className="-rotate-90"
        >
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            className="stroke-muted"
            strokeWidth={strokeWidth}
          />

          {noCount > 0 && (
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              className="stroke-rose-500"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={0}
            />
          )}

          {yesCount > 0 && (
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              className="stroke-emerald-500"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${yesArc} ${circumference - yesArc}`}
              strokeDashoffset={0}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-foreground text-sm leading-none font-bold tabular-nums">
            {majorityPct}%
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium',
                majorityYes || isEqual ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <Check
                className={cn(
                  'size-3.5 shrink-0',
                  majorityYes || isEqual
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground'
                )}
                aria-hidden
              />
              {t('yesLabel')}
            </span>

            <span className="text-foreground text-xs font-medium tabular-nums">
              {yesCount}{' '}
              <span className="text-muted-foreground font-normal">({yesPercentage}%)</span>
            </span>
          </div>

          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${yesPercentage}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium',
                !majorityYes || isEqual ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <X
                className={cn(
                  'size-3.5 shrink-0',
                  !majorityYes || isEqual
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-muted-foreground'
                )}
                aria-hidden
              />
              {t('noLabel')}
            </span>

            <span className="text-foreground text-xs font-medium tabular-nums">
              {noCount} <span className="text-muted-foreground font-normal">({noPercentage}%)</span>
            </span>
          </div>

          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-rose-500 transition-all"
              style={{ width: `${noPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
