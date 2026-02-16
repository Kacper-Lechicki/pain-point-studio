'use client';

import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import type { QuestionAnswerData } from '@/features/surveys/actions/get-survey-stats';
import {
  getBarColor,
  getBarMutedColor,
  getRingColor,
  getSentimentColor,
  getSentimentKey,
} from '@/features/surveys/lib/rating-helpers';
import { cn } from '@/lib/common/utils';

interface RatingDistributionChartProps {
  answers: QuestionAnswerData[];
  /** Question config — expected to contain `min` and `max` for rating scale. */
  config: Record<string, unknown>;
}

export const RatingDistributionChart = ({ answers, config }: RatingDistributionChartProps) => {
  const t = useTranslations();

  const scaleMin = (config.min as number) ?? 1;
  const scaleMax = (config.max as number) ?? 5;

  const { bars, average, median, mode, ratio } = useMemo(() => {
    const counts = new Map<number, number>();
    const values: number[] = [];
    let sum = 0;

    for (const a of answers) {
      const rating = a.value.rating as number;

      if (typeof rating === 'number') {
        counts.set(rating, (counts.get(rating) ?? 0) + 1);
        sum += rating;
        values.push(rating);
      }
    }

    values.sort((a, b) => a - b);
    const n = values.length;
    const mid = Math.floor(n / 2);
    const medianValue =
      n === 0 ? 0 : n % 2 === 0 ? (values[mid - 1]! + values[mid]!) / 2 : values[mid]!;

    let modeValue = 0;
    let maxCount = 0;

    for (const [r, c] of counts.entries()) {
      if (c > maxCount) {
        maxCount = c;
        modeValue = r;
      }
    }

    const chartBars: { rating: number; count: number }[] = [];

    for (let r = scaleMin; r <= scaleMax; r++) {
      chartBars.push({ rating: r, count: counts.get(r) ?? 0 });
    }

    return {
      bars: chartBars,
      average: n > 0 ? sum / n : 0,
      median: medianValue,
      mode: modeValue,
      ratio: n > 0 && scaleMax > 0 ? sum / n / scaleMax : 0,
    };
  }, [answers, scaleMin, scaleMax]);

  if (bars.length === 0) {
    return <p className="text-muted-foreground text-xs">{t('surveys.stats.noChartData')}</p>;
  }

  const maxBarCount = Math.max(...bars.map((b) => b.count));
  const sentimentKey = getSentimentKey(ratio);
  const sentimentColor = getSentimentColor(ratio);
  const ringColor = getRingColor(ratio);

  // SVG ring params
  const ringSize = 72;
  const strokeWidth = 5;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ratio);

  return (
    <div className="space-y-4">
      {/* Score card */}
      <div className="flex items-center gap-4">
        {/* Progress ring */}
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
            {t(`surveys.stats.sentiment.${sentimentKey}` as Parameters<typeof t>[0])}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px] font-normal">
              {t(
                'surveys.stats.medianShort' as Parameters<typeof t>[0],
                {
                  value: median % 1 === 0 ? String(median) : median.toFixed(1),
                } as never
              )}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-normal">
              {t(
                'surveys.stats.modeShort' as Parameters<typeof t>[0],
                {
                  value: mode,
                } as never
              )}
            </Badge>
          </div>
        </div>
      </div>

      {/* Distribution bars */}
      <div className="flex items-end gap-1">
        {bars.map((bar) => {
          const barHeight = maxBarCount > 0 ? (bar.count / maxBarCount) * 100 : 0;
          const hasCount = bar.count > 0;

          return (
            <div key={bar.rating} className="flex flex-1 flex-col items-center gap-1">
              {hasCount && (
                <span className="text-muted-foreground text-[10px] tabular-nums">{bar.count}</span>
              )}
              <div className="flex h-40 w-full items-end">
                <div
                  className={cn(
                    'w-full rounded-t transition-all',
                    hasCount
                      ? getBarColor(bar.rating, scaleMin, scaleMax)
                      : getBarMutedColor(bar.rating, scaleMin, scaleMax)
                  )}
                  style={{ height: `${Math.max(barHeight, 4)}%` }}
                />
              </div>
              <span
                className={cn(
                  'text-[11px] tabular-nums',
                  hasCount ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {bar.rating}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
