'use client';

import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import {
  computeRatingStats,
  getBarColor,
  getRingColor,
  getSentimentColor,
  getSentimentKey,
} from '@/features/surveys/lib/rating-helpers';
import type { QuestionAnswerData } from '@/features/surveys/types';
import { cn } from '@/lib/common/utils';

interface RatingDistributionChartProps {
  answers: QuestionAnswerData[];
  config: Record<string, unknown>;
}

export const RatingDistributionChart = ({ answers, config }: RatingDistributionChartProps) => {
  const t = useTranslations('surveys.stats');
  const scaleMin = (config.min as number) ?? 1;
  const scaleMax = (config.max as number) ?? 5;
  const { bars, average, median, mode, ratio } = computeRatingStats(answers, scaleMin, scaleMax);

  if (bars.length === 0) {
    return <p className="text-muted-foreground text-xs">{t('noChartData')}</p>;
  }

  const maxBarCount = Math.max(...bars.map((b) => b.count));
  const sentimentKey = getSentimentKey(ratio);
  const sentimentColor = getSentimentColor(ratio);
  const ringColor = getRingColor(ratio);
  const ringSize = 72;
  const strokeWidth = 5;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ratio);

  return (
    <div className="space-y-4">
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

            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              className={ringColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-foreground text-sm leading-none font-bold tabular-nums">
              {average.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-foreground text-2xl leading-none font-bold tabular-nums">
              {average.toFixed(1)}
            </span>

            <span className="text-muted-foreground text-sm font-normal">/ {scaleMax}</span>
          </div>

          <p className={cn('mt-1 text-xs font-medium', sentimentColor)}>
            {t(`sentiment.${sentimentKey}` as Parameters<typeof t>[0])}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px] font-normal">
              {t('medianShort', {
                value: median % 1 === 0 ? String(median) : median.toFixed(1),
              } as never)}
            </Badge>

            <Badge variant="outline" className="text-[10px] font-normal">
              {t('modeShort', {
                value: mode,
              } as never)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 items-end gap-1 overflow-x-auto">
        {bars.map((bar) => {
          const barHeight = maxBarCount > 0 ? (bar.count / maxBarCount) * 100 : 0;
          const hasCount = bar.count > 0;
          const total = bars.reduce((s, b) => s + b.count, 0);
          const pct = total > 0 ? Math.round((bar.count / total) * 100) : 0;

          return (
            <div key={bar.rating} className="flex min-w-[28px] flex-1 flex-col items-center gap-1">
              <div className="flex h-40 w-full flex-col items-center justify-end gap-1">
                {hasCount && (
                  <span className="text-foreground text-[11px] font-semibold tabular-nums">
                    {bar.count}
                    <span className="text-muted-foreground ml-0.5 text-[9px] font-normal">
                      ({pct}%)
                    </span>
                  </span>
                )}
                <div
                  className={cn(
                    'w-full rounded-t transition-all',
                    getBarColor(bar.rating, scaleMin, scaleMax, !hasCount)
                  )}
                  style={{ height: `${Math.max(barHeight, 4)}%` }}
                />
              </div>

              <span className="text-muted-foreground text-[10px] tabular-nums">
                {'★'}
                {bar.rating}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
