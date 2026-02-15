import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  calculateCompletionRate,
  calculateRespondentProgress,
  daysUntilExpiry,
  formatCompletionTime,
} from './calculations';

// ── calculateCompletionRate ─────────────────────────────────────────

describe('calculateCompletionRate', () => {
  it('returns rounded percentage', () => {
    expect(calculateCompletionRate(3, 10)).toBe(30);
  });

  it('returns 100 when completed equals total', () => {
    expect(calculateCompletionRate(5, 5)).toBe(100);
  });

  it('returns 0 when no completions', () => {
    expect(calculateCompletionRate(0, 10)).toBe(0);
  });

  it('rounds to nearest integer', () => {
    expect(calculateCompletionRate(1, 3)).toBe(33);
    expect(calculateCompletionRate(2, 3)).toBe(67);
  });

  it('returns null when total is 0', () => {
    expect(calculateCompletionRate(0, 0)).toBeNull();
  });
});

// ── calculateRespondentProgress ─────────────────────────────────────

describe('calculateRespondentProgress', () => {
  it('returns percentage of completed vs max', () => {
    expect(calculateRespondentProgress(5, 10)).toBe(50);
  });

  it('caps at 100 when completed exceeds max', () => {
    expect(calculateRespondentProgress(15, 10)).toBe(100);
  });

  it('returns null when max is null', () => {
    expect(calculateRespondentProgress(5, null)).toBeNull();
  });

  it('returns null when max is undefined', () => {
    expect(calculateRespondentProgress(5, undefined)).toBeNull();
  });

  it('returns null when max is 0', () => {
    expect(calculateRespondentProgress(5, 0)).toBeNull();
  });
});

// ── daysUntilExpiry ─────────────────────────────────────────────────

describe('daysUntilExpiry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns remaining days when not expired', () => {
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));

    // Archived 10 days ago, 30-day limit → 20 days left
    const result = daysUntilExpiry('2024-12-22T00:00:00Z', 30);

    expect(result).toBe(20);
  });

  it('returns null when expired', () => {
    vi.setSystemTime(new Date('2025-02-01T00:00:00Z'));

    // Archived 31 days ago, 30-day limit → expired
    const result = daysUntilExpiry('2025-01-01T00:00:00Z', 30);

    expect(result).toBeNull();
  });

  it('returns null when timestampAt is null', () => {
    expect(daysUntilExpiry(null, 30)).toBeNull();
  });

  it('returns null when timestampAt is undefined', () => {
    expect(daysUntilExpiry(undefined, 30)).toBeNull();
  });

  it('returns 1 on the last day before expiry', () => {
    vi.setSystemTime(new Date('2025-01-30T12:00:00Z'));

    // Archived exactly 29 days ago, 30-day limit → 1 day left
    const result = daysUntilExpiry('2025-01-01T00:00:00Z', 30);

    expect(result).toBe(1);
  });
});

// ── formatCompletionTime ────────────────────────────────────────────

describe('formatCompletionTime', () => {
  it('formats seconds only', () => {
    expect(formatCompletionTime(45)).toBe('45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatCompletionTime(150)).toBe('2m 30s');
  });

  it('formats exact minutes', () => {
    expect(formatCompletionTime(120)).toBe('2m 0s');
  });

  it('returns null for null input', () => {
    expect(formatCompletionTime(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(formatCompletionTime(undefined)).toBeNull();
  });

  it('returns null for 0', () => {
    expect(formatCompletionTime(0)).toBeNull();
  });

  it('returns null for negative values', () => {
    expect(formatCompletionTime(-10)).toBeNull();
  });
});
