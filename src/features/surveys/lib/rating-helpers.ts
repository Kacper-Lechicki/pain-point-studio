import { RATING_THRESHOLDS } from '@/features/surveys/config';

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

export function getBarColor(rating: number, scaleMin: number, scaleMax: number): string {
  const range = scaleMax - scaleMin;

  if (range === 0) {
    return 'bg-amber-500';
  }

  const position = (rating - scaleMin) / range;

  if (position <= RATING_THRESHOLDS.bar.low) {
    return 'bg-rose-500';
  }

  if (position <= RATING_THRESHOLDS.bar.mid) {
    return 'bg-amber-500';
  }

  return 'bg-emerald-500';
}

export function getBarMutedColor(rating: number, scaleMin: number, scaleMax: number): string {
  const range = scaleMax - scaleMin;

  if (range === 0) {
    return 'bg-amber-500/20';
  }

  const position = (rating - scaleMin) / range;

  if (position <= RATING_THRESHOLDS.bar.low) {
    return 'bg-rose-500/20';
  }

  if (position <= RATING_THRESHOLDS.bar.mid) {
    return 'bg-amber-500/20';
  }

  return 'bg-emerald-500/20';
}
