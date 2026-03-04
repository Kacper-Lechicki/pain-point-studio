import { RATING_THRESHOLDS } from '@/features/surveys/config';

interface RatingBar {
  rating: number;
  count: number;
}

export interface RatingStats {
  bars: RatingBar[];
  average: number;
  median: number;
  mode: number;
  ratio: number;
}

export function computeRatingStats(
  answers: { value: Record<string, unknown> }[],
  scaleMin: number,
  scaleMax: number
): RatingStats {
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

  const median = n === 0 ? 0 : n % 2 === 0 ? (values[mid - 1]! + values[mid]!) / 2 : values[mid]!;

  let mode = 0;
  let maxCount = 0;

  for (const [r, c] of counts.entries()) {
    if (c > maxCount) {
      maxCount = c;
      mode = r;
    }
  }

  const bars: RatingBar[] = [];

  for (let r = scaleMin; r <= scaleMax; r++) {
    bars.push({ rating: r, count: counts.get(r) ?? 0 });
  }

  return {
    bars,
    average: n > 0 ? sum / n : 0,
    median,
    mode,
    ratio: n > 0 && scaleMax > 0 ? sum / n / scaleMax : 0,
  };
}

export function getSentimentKey(ratio: number): string {
  if (ratio >= RATING_THRESHOLDS.sentiment.excellent) {
    return 'excellent';
  }

  if (ratio >= RATING_THRESHOLDS.sentiment.good) {
    return 'good';
  }

  if (ratio >= RATING_THRESHOLDS.sentiment.fair) {
    return 'fair';
  }

  return 'poor';
}

export function getSentimentColor(ratio: number): string {
  if (ratio >= RATING_THRESHOLDS.color.good) {
    return 'text-emerald-600 dark:text-emerald-400';
  }

  if (ratio >= RATING_THRESHOLDS.color.fair) {
    return 'text-amber-600 dark:text-amber-400';
  }

  return 'text-rose-600 dark:text-rose-400';
}

export function getRingColor(ratio: number): string {
  if (ratio >= RATING_THRESHOLDS.color.good) {
    return 'stroke-emerald-500';
  }

  if (ratio >= RATING_THRESHOLDS.color.fair) {
    return 'stroke-amber-500';
  }

  return 'stroke-rose-500';
}

export function getBarColor(
  rating: number,
  scaleMin: number,
  scaleMax: number,
  muted = false
): string {
  const range = scaleMax - scaleMin;
  const suffix = muted ? '/20' : '';

  if (range === 0) {
    return `bg-amber-500${suffix}`;
  }

  const position = (rating - scaleMin) / range;

  if (position <= RATING_THRESHOLDS.bar.low) {
    return `bg-rose-500${suffix}`;
  }

  if (position <= RATING_THRESHOLDS.bar.mid) {
    return `bg-amber-500${suffix}`;
  }

  return `bg-emerald-500${suffix}`;
}
