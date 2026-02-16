import { describe, expect, it } from 'vitest';

import {
  getBarColor,
  getBarMutedColor,
  getRingColor,
  getSentimentColor,
  getSentimentKey,
} from './rating-helpers';

// ── getSentimentKey ───────────────────────────────────────────────────

describe('getSentimentKey', () => {
  it('returns "excellent" at threshold 0.8', () => {
    expect(getSentimentKey(0.8)).toBe('excellent');
  });

  it('returns "excellent" above threshold', () => {
    expect(getSentimentKey(1.0)).toBe('excellent');
  });

  it('returns "good" at threshold 0.6', () => {
    expect(getSentimentKey(0.6)).toBe('good');
  });

  it('returns "good" just below excellent threshold', () => {
    expect(getSentimentKey(0.79)).toBe('good');
  });

  it('returns "fair" at threshold 0.4', () => {
    expect(getSentimentKey(0.4)).toBe('fair');
  });

  it('returns "fair" just below good threshold', () => {
    expect(getSentimentKey(0.59)).toBe('fair');
  });

  it('returns "poor" just below fair threshold', () => {
    expect(getSentimentKey(0.39)).toBe('poor');
  });

  it('returns "poor" for 0', () => {
    expect(getSentimentKey(0)).toBe('poor');
  });
});

// ── getSentimentColor ─────────────────────────────────────────────────

describe('getSentimentColor', () => {
  it('returns emerald at threshold 0.7', () => {
    expect(getSentimentColor(0.7)).toBe('text-emerald-600 dark:text-emerald-400');
  });

  it('returns emerald above threshold', () => {
    expect(getSentimentColor(1.0)).toBe('text-emerald-600 dark:text-emerald-400');
  });

  it('returns amber at threshold 0.4', () => {
    expect(getSentimentColor(0.4)).toBe('text-amber-600 dark:text-amber-400');
  });

  it('returns amber just below good threshold', () => {
    expect(getSentimentColor(0.69)).toBe('text-amber-600 dark:text-amber-400');
  });

  it('returns rose just below fair threshold', () => {
    expect(getSentimentColor(0.39)).toBe('text-rose-600 dark:text-rose-400');
  });

  it('returns rose for 0', () => {
    expect(getSentimentColor(0)).toBe('text-rose-600 dark:text-rose-400');
  });
});

// ── getRingColor ──────────────────────────────────────────────────────

describe('getRingColor', () => {
  it('returns emerald at threshold 0.7', () => {
    expect(getRingColor(0.7)).toBe('stroke-emerald-500');
  });

  it('returns emerald above threshold', () => {
    expect(getRingColor(0.9)).toBe('stroke-emerald-500');
  });

  it('returns amber at threshold 0.4', () => {
    expect(getRingColor(0.4)).toBe('stroke-amber-500');
  });

  it('returns amber just below good threshold', () => {
    expect(getRingColor(0.69)).toBe('stroke-amber-500');
  });

  it('returns rose just below fair threshold', () => {
    expect(getRingColor(0.39)).toBe('stroke-rose-500');
  });

  it('returns rose for 0', () => {
    expect(getRingColor(0)).toBe('stroke-rose-500');
  });
});

// ── getBarColor ───────────────────────────────────────────────────────

describe('getBarColor', () => {
  it('returns amber when range is 0', () => {
    expect(getBarColor(5, 5, 5)).toBe('bg-amber-500');
  });

  it('returns rose below low boundary', () => {
    expect(getBarColor(0.2, 0, 1)).toBe('bg-rose-500');
  });

  it('returns rose when position is exactly 0.33', () => {
    expect(getBarColor(0.33, 0, 1)).toBe('bg-rose-500');
  });

  it('returns amber just above low boundary', () => {
    expect(getBarColor(0.34, 0, 1)).toBe('bg-amber-500');
  });

  it('returns amber at mid boundary (position <= 0.66)', () => {
    expect(getBarColor(0.66, 0, 1)).toBe('bg-amber-500');
  });

  it('returns emerald just above mid boundary', () => {
    expect(getBarColor(0.67, 0, 1)).toBe('bg-emerald-500');
  });

  it('returns emerald at max of scale', () => {
    expect(getBarColor(10, 1, 10)).toBe('bg-emerald-500');
  });
});

// ── getBarMutedColor ──────────────────────────────────────────────────

describe('getBarMutedColor', () => {
  it('returns muted amber when range is 0', () => {
    expect(getBarMutedColor(5, 5, 5)).toBe('bg-amber-500/20');
  });

  it('returns muted rose below low boundary', () => {
    expect(getBarMutedColor(0.2, 0, 1)).toBe('bg-rose-500/20');
  });

  it('returns muted rose when position is exactly 0.33', () => {
    expect(getBarMutedColor(0.33, 0, 1)).toBe('bg-rose-500/20');
  });

  it('returns muted amber just above low boundary', () => {
    expect(getBarMutedColor(0.34, 0, 1)).toBe('bg-amber-500/20');
  });

  it('returns muted amber at mid boundary (position <= 0.66)', () => {
    expect(getBarMutedColor(0.66, 0, 1)).toBe('bg-amber-500/20');
  });

  it('returns muted emerald just above mid boundary', () => {
    expect(getBarMutedColor(0.67, 0, 1)).toBe('bg-emerald-500/20');
  });

  it('returns muted emerald at max of scale', () => {
    expect(getBarMutedColor(10, 1, 10)).toBe('bg-emerald-500/20');
  });
});
