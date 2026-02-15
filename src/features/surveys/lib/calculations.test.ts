import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  calculateAvgQuestionCompletion,
  calculateRespondentProgress,
  calculateSubmissionRate,
  daysUntilExpiry,
  formatCompletionTime,
} from './calculations';

// ── calculateSubmissionRate ─────────────────────────────────────────

describe('calculateSubmissionRate', () => {
  it('returns rounded percentage', () => {
    expect(calculateSubmissionRate(3, 10)).toBe(30);
  });

  it('returns 100 when completed equals total', () => {
    expect(calculateSubmissionRate(5, 5)).toBe(100);
  });

  it('returns 0 when no completions', () => {
    expect(calculateSubmissionRate(0, 10)).toBe(0);
  });

  it('rounds to nearest integer', () => {
    expect(calculateSubmissionRate(1, 3)).toBe(33);
    expect(calculateSubmissionRate(2, 3)).toBe(67);
  });

  it('returns null when total is 0', () => {
    expect(calculateSubmissionRate(0, 0)).toBeNull();
  });
});

// ── calculateAvgQuestionCompletion ──────────────────────────────────

describe('calculateAvgQuestionCompletion', () => {
  it('returns 100 when all questions answered by all respondents', () => {
    // 3 questions, 5 completed responses, each question has 5 answers
    expect(calculateAvgQuestionCompletion([5, 5, 5], 5)).toBe(100);
  });

  it('returns correct percentage for partial completion', () => {
    // 4 questions, 10 completed, answers: [10, 8, 6, 4] = 28 / 40 = 70%
    expect(calculateAvgQuestionCompletion([10, 8, 6, 4], 10)).toBe(70);
  });

  it('returns null when no questions', () => {
    expect(calculateAvgQuestionCompletion([], 5)).toBeNull();
  });

  it('returns null when no completed responses', () => {
    expect(calculateAvgQuestionCompletion([3, 2, 1], 0)).toBeNull();
  });

  it('rounds to nearest integer', () => {
    // 2 questions, 3 completed, answers: [2, 1] = 3 / 6 = 50%
    expect(calculateAvgQuestionCompletion([2, 1], 3)).toBe(50);
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

    // Archived 10 days ago, 14-day limit → 4 days left
    const result = daysUntilExpiry('2024-12-22T00:00:00Z', 14);

    expect(result).toBe(4);
  });

  it('returns null when expired', () => {
    vi.setSystemTime(new Date('2025-01-16T00:00:00Z'));

    // Archived 15 days ago, 14-day limit → expired
    const result = daysUntilExpiry('2025-01-01T00:00:00Z', 14);

    expect(result).toBeNull();
  });

  it('returns null when timestampAt is null', () => {
    expect(daysUntilExpiry(null, 14)).toBeNull();
  });

  it('returns null when timestampAt is undefined', () => {
    expect(daysUntilExpiry(undefined, 14)).toBeNull();
  });

  it('returns 1 on the last day before expiry', () => {
    vi.setSystemTime(new Date('2025-01-14T12:00:00Z'));

    // Archived exactly 13 days ago, 14-day limit → 1 day left
    const result = daysUntilExpiry('2025-01-01T00:00:00Z', 14);

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
