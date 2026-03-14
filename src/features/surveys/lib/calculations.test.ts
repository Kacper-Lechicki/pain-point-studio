/** Tests for survey calculation utilities (submission rate, completion, progress, time formatting). */
import { describe, expect, it } from 'vitest';

import {
  calculateAvgQuestionCompletion,
  calculateRespondentProgress,
  calculateSubmissionRate,
  formatCompletionTime,
} from './calculations';

// ── calculateSubmissionRate ─────────────────────────────────────────

describe('calculateSubmissionRate', () => {
  it('should return rounded percentage', () => {
    expect(calculateSubmissionRate(3, 10)).toBe(30);
  });

  it('should return 100 when completed equals total', () => {
    expect(calculateSubmissionRate(5, 5)).toBe(100);
  });

  it('should return 0 when no completions', () => {
    expect(calculateSubmissionRate(0, 10)).toBe(0);
  });

  it('should round to nearest integer', () => {
    expect(calculateSubmissionRate(1, 3)).toBe(33);
    expect(calculateSubmissionRate(2, 3)).toBe(67);
  });

  it('should return null when total is 0', () => {
    expect(calculateSubmissionRate(0, 0)).toBeNull();
  });
});

// ── calculateAvgQuestionCompletion ──────────────────────────────────

describe('calculateAvgQuestionCompletion', () => {
  it('should return 100 when all questions answered by all respondents', () => {
    // 3 questions, 5 completed responses, each question has 5 answers
    expect(calculateAvgQuestionCompletion([5, 5, 5], 5)).toBe(100);
  });

  it('should return correct percentage for partial completion', () => {
    // 4 questions, 10 completed, answers: [10, 8, 6, 4] = 28 / 40 = 70%
    expect(calculateAvgQuestionCompletion([10, 8, 6, 4], 10)).toBe(70);
  });

  it('should return null when no questions', () => {
    expect(calculateAvgQuestionCompletion([], 5)).toBeNull();
  });

  it('should return null when no completed responses', () => {
    expect(calculateAvgQuestionCompletion([3, 2, 1], 0)).toBeNull();
  });

  it('should round to nearest integer', () => {
    // 2 questions, 3 completed, answers: [2, 1] = 3 / 6 = 50%
    expect(calculateAvgQuestionCompletion([2, 1], 3)).toBe(50);
  });
});

// ── calculateRespondentProgress ─────────────────────────────────────

describe('calculateRespondentProgress', () => {
  it('should return percentage of completed vs max', () => {
    expect(calculateRespondentProgress(5, 10)).toBe(50);
  });

  it('should cap at 100 when completed exceeds max', () => {
    expect(calculateRespondentProgress(15, 10)).toBe(100);
  });

  it('should return null when max is null', () => {
    expect(calculateRespondentProgress(5, null)).toBeNull();
  });

  it('should return null when max is undefined', () => {
    expect(calculateRespondentProgress(5, undefined)).toBeNull();
  });

  it('should return null when max is 0', () => {
    expect(calculateRespondentProgress(5, 0)).toBeNull();
  });
});

// ── formatCompletionTime ────────────────────────────────────────────

describe('formatCompletionTime', () => {
  it('should format seconds only', () => {
    expect(formatCompletionTime(45)).toBe('45s');
  });

  it('should format minutes and seconds', () => {
    expect(formatCompletionTime(150)).toBe('2m 30s');
  });

  it('should format exact minutes', () => {
    expect(formatCompletionTime(120)).toBe('2m 0s');
  });

  it('should return null for null input', () => {
    expect(formatCompletionTime(null)).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(formatCompletionTime(undefined)).toBeNull();
  });

  it('should return null for 0', () => {
    expect(formatCompletionTime(0)).toBeNull();
  });

  it('should return null for negative values', () => {
    expect(formatCompletionTime(-10)).toBeNull();
  });
});
