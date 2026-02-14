'use client';

import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import type { QuestionAnswerData } from '@/features/surveys/actions/get-survey-stats';

interface RatingDistributionChartProps {
  answers: QuestionAnswerData[];
}

const DOT_SIZE = 10;
const DOT_GAP = 4;
const MAX_DOTS_PER_COL = 4;

export const RatingDistributionChart = ({ answers }: RatingDistributionChartProps) => {
  const t = useTranslations('surveys.stats');

  const { scaleCounts, average, median, min, max, mode } = useMemo(() => {
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
    const minVal = n === 0 ? 0 : values[0]!;
    const maxVal = n === 0 ? 0 : values[n - 1]!;

    let modeValue = 0;
    let maxCount = 0;

    for (const [r, c] of counts.entries()) {
      if (c > maxCount) {
        maxCount = c;
        modeValue = r;
      }
    }

    const scaleMin = 1;
    const scaleMax = maxVal;
    const scaleCounts: { rating: number; count: number }[] = [];

    for (let r = scaleMin; r <= scaleMax; r++) {
      scaleCounts.push({ rating: r, count: counts.get(r) ?? 0 });
    }

    return {
      scaleCounts,
      average: n > 0 ? sum / n : 0,
      median: medianValue,
      min: minVal,
      max: maxVal,
      mode: modeValue,
    };
  }, [answers]);

  if (scaleCounts.length === 0) {
    return <p className="text-muted-foreground text-xs">{t('noChartData')}</p>;
  }

  const showRange = min !== max;

  return (
    <div className="space-y-4">
      <div className="text-muted-foreground flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span>{t('average', { value: average.toFixed(1) })}</span>
        {median !== average && <span>{t('median', { value: median.toFixed(1) })}</span>}
        {showRange && <span>{t('minMax', { min, max })}</span>}
        <span>{t('mode', { value: mode })}</span>
      </div>

      <div
        className="flex flex-col items-stretch gap-3 py-2"
        role="img"
        aria-label={t('chartResponses')}
      >
        <div
          className="flex items-end justify-between gap-1"
          style={{
            minHeight: MAX_DOTS_PER_COL * (DOT_SIZE + DOT_GAP) + DOT_SIZE,
          }}
        >
          {scaleCounts.map(({ rating, count }) => (
            <div
              key={rating}
              className="flex flex-1 flex-col items-center gap-2"
              title={`${rating}: ${count} ${t('chartResponses').toLowerCase()}`}
            >
              <div
                className="flex flex-col-reverse flex-wrap items-center justify-end gap-0.5"
                style={{
                  minHeight:
                    count > 0 ? Math.min(count, MAX_DOTS_PER_COL) * (DOT_SIZE + DOT_GAP) : DOT_SIZE,
                }}
              >
                {Array.from({ length: Math.min(count, MAX_DOTS_PER_COL) }, (_, i) => (
                  <div
                    key={i}
                    className="shrink-0 rounded-full"
                    style={{
                      width: DOT_SIZE,
                      height: DOT_SIZE,
                      backgroundColor: 'var(--chart-rating)',
                    }}
                  />
                ))}
                {count > MAX_DOTS_PER_COL && (
                  <span
                    className="text-muted-foreground text-[10px] font-medium tabular-nums"
                    style={{ color: 'var(--chart-rating)' }}
                  >
                    +{count - MAX_DOTS_PER_COL}
                  </span>
                )}
              </div>
              <span className="text-muted-foreground text-xs font-semibold tabular-nums">
                {rating}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
