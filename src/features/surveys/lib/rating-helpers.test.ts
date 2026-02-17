/** Tests for rating display helpers (sentiment keys, colors, ring/bar colors). */
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
  it('should return "excellent" at threshold 0.8', () => {
    expect(getSentimentKey(0.8)).toBe('excellent');
  });

  it('should return "excellent" above threshold', () => {
    expect(getSentimentKey(1.0)).toBe('excellent');
  });

  it('should return "good" at threshold 0.6', () => {
    expect(getSentimentKey(0.6)).toBe('good');
  });

  it('should return "good" just below excellent threshold', () => {
    expect(getSentimentKey(0.79)).toBe('good');
  });

  it('should return "fair" at threshold 0.4', () => {
    expect(getSentimentKey(0.4)).toBe('fair');
  });

  it('should return "fair" just below good threshold', () => {
    expect(getSentimentKey(0.59)).toBe('fair');
  });

  it('should return "poor" just below fair threshold', () => {
    expect(getSentimentKey(0.39)).toBe('poor');
  });

  it('should return "poor" for 0', () => {
    expect(getSentimentKey(0)).toBe('poor');
  });
});

// ── getSentimentColor ─────────────────────────────────────────────────

describe('getSentimentColor', () => {
  it('should return emerald at threshold 0.7', () => {
    expect(getSentimentColor(0.7)).toBe('text-emerald-600 dark:text-emerald-400');
  });

  it('should return emerald above threshold', () => {
    expect(getSentimentColor(1.0)).toBe('text-emerald-600 dark:text-emerald-400');
  });

  it('should return amber at threshold 0.4', () => {
    expect(getSentimentColor(0.4)).toBe('text-amber-600 dark:text-amber-400');
  });

  it('should return amber just below good threshold', () => {
    expect(getSentimentColor(0.69)).toBe('text-amber-600 dark:text-amber-400');
  });

  it('should return rose just below fair threshold', () => {
    expect(getSentimentColor(0.39)).toBe('text-rose-600 dark:text-rose-400');
  });

  it('should return rose for 0', () => {
    expect(getSentimentColor(0)).toBe('text-rose-600 dark:text-rose-400');
  });
});

// ── getRingColor ──────────────────────────────────────────────────────

describe('getRingColor', () => {
  it('should return emerald at threshold 0.7', () => {
    expect(getRingColor(0.7)).toBe('stroke-emerald-500');
  });

  it('should return emerald above threshold', () => {
    expect(getRingColor(0.9)).toBe('stroke-emerald-500');
  });

  it('should return amber at threshold 0.4', () => {
    expect(getRingColor(0.4)).toBe('stroke-amber-500');
  });

  it('should return amber just below good threshold', () => {
    expect(getRingColor(0.69)).toBe('stroke-amber-500');
  });

  it('should return rose just below fair threshold', () => {
    expect(getRingColor(0.39)).toBe('stroke-rose-500');
  });

  it('should return rose for 0', () => {
    expect(getRingColor(0)).toBe('stroke-rose-500');
  });
});

// ── getBarColor ───────────────────────────────────────────────────────

describe('getBarColor', () => {
  it('should return amber when range is 0', () => {
    expect(getBarColor(5, 5, 5)).toBe('bg-amber-500');
  });

  it('should return rose below low boundary', () => {
    expect(getBarColor(0.2, 0, 1)).toBe('bg-rose-500');
  });

  it('should return rose when position is exactly 0.33', () => {
    expect(getBarColor(0.33, 0, 1)).toBe('bg-rose-500');
  });

  it('should return amber just above low boundary', () => {
    expect(getBarColor(0.34, 0, 1)).toBe('bg-amber-500');
  });

  it('should return amber at mid boundary (position <= 0.66)', () => {
    expect(getBarColor(0.66, 0, 1)).toBe('bg-amber-500');
  });

  it('should return emerald just above mid boundary', () => {
    expect(getBarColor(0.67, 0, 1)).toBe('bg-emerald-500');
  });

  it('should return emerald at max of scale', () => {
    expect(getBarColor(10, 1, 10)).toBe('bg-emerald-500');
  });
});

// ── getBarMutedColor ──────────────────────────────────────────────────

describe('getBarMutedColor', () => {
  it('should return muted amber when range is 0', () => {
    expect(getBarMutedColor(5, 5, 5)).toBe('bg-amber-500/20');
  });

  it('should return muted rose below low boundary', () => {
    expect(getBarMutedColor(0.2, 0, 1)).toBe('bg-rose-500/20');
  });

  it('should return muted rose when position is exactly 0.33', () => {
    expect(getBarMutedColor(0.33, 0, 1)).toBe('bg-rose-500/20');
  });

  it('should return muted amber just above low boundary', () => {
    expect(getBarMutedColor(0.34, 0, 1)).toBe('bg-amber-500/20');
  });

  it('should return muted amber at mid boundary (position <= 0.66)', () => {
    expect(getBarMutedColor(0.66, 0, 1)).toBe('bg-amber-500/20');
  });

  it('should return muted emerald just above mid boundary', () => {
    expect(getBarMutedColor(0.67, 0, 1)).toBe('bg-emerald-500/20');
  });

  it('should return muted emerald at max of scale', () => {
    expect(getBarMutedColor(10, 1, 10)).toBe('bg-emerald-500/20');
  });
});
