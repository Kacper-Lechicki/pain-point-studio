/** Tests for computeInsight across all question types (multiple choice, rating, yes/no, text). */
import { describe, expect, it, vi } from 'vitest';

import type { QuestionAnswerData } from '@/features/surveys/actions/get-survey-stats';

import { computeInsight } from './compute-insight';

const t = vi.fn((key: string, params?: Record<string, unknown>) =>
  JSON.stringify({ key, ...params })
);

function answer(value: Record<string, unknown>): QuestionAnswerData {
  return { value, completedAt: '2024-01-01T00:00:00Z' };
}

// ── computeInsight ────────────────────────────────────────────────────

describe('computeInsight', () => {
  it('should return null for empty answers', () => {
    expect(computeInsight('multiple_choice', [], {}, t as never)).toBeNull();
  });

  describe('multiple_choice', () => {
    it('should return top choice when a single winner exists', () => {
      const answers = [
        answer({ selected: ['A', 'B'] }),
        answer({ selected: ['A'] }),
        answer({ selected: ['A'] }),
      ];

      const result = computeInsight('multiple_choice', answers, {}, t as never);
      const parsed = JSON.parse(result!);

      expect(parsed.key).toBe('surveys.stats.insightTopChoice');
      expect(parsed.option).toBe('A');
      expect(parsed.pct).toBe(75);
    });

    it('should return tied choices when multiple options share the top count', () => {
      const answers = [answer({ selected: ['A'] }), answer({ selected: ['B'] })];

      const result = computeInsight('multiple_choice', answers, {}, t as never);
      const parsed = JSON.parse(result!);

      expect(parsed.key).toBe('surveys.stats.insightTiedChoices');
      expect(parsed.options).toBe('A, B');
      expect(parsed.pct).toBe(50);
    });

    it('should include "other" answers in counts', () => {
      const answers = [
        answer({ selected: [], other: 'Custom' }),
        answer({ selected: [], other: 'Custom' }),
        answer({ selected: ['A'] }),
      ];

      const result = computeInsight('multiple_choice', answers, {}, t as never);
      const parsed = JSON.parse(result!);

      expect(parsed.key).toBe('surveys.stats.insightTopChoice');
      expect(parsed.pct).toBe(67);
    });

    it('should return null when all selections are empty arrays', () => {
      const answers = [answer({ selected: [] }), answer({ selected: [] })];

      expect(computeInsight('multiple_choice', answers, {}, t as never)).toBeNull();
    });
  });

  describe('rating_scale', () => {
    it('should compute average rating with default max', () => {
      const answers = [answer({ rating: 3 }), answer({ rating: 5 }), answer({ rating: 4 })];

      const result = computeInsight('rating_scale', answers, {}, t as never);
      const parsed = JSON.parse(result!);

      expect(parsed.key).toBe('surveys.stats.insightAvgRating');
      expect(parsed.value).toBe('4.0');
      expect(parsed.max).toBe(5);
    });

    it('should use config.max when provided', () => {
      const answers = [answer({ rating: 7 }), answer({ rating: 9 })];

      const result = computeInsight('rating_scale', answers, { max: 10 }, t as never);
      const parsed = JSON.parse(result!);

      expect(parsed.max).toBe(10);
      expect(parsed.value).toBe('8.0');
    });

    it('should return null when no valid ratings exist', () => {
      const answers = [answer({ rating: undefined }), answer({ rating: 'bad' })];

      expect(computeInsight('rating_scale', answers, {}, t as never)).toBeNull();
    });
  });

  describe('yes_no', () => {
    it('should report majority yes', () => {
      const answers = [
        answer({ answer: true }),
        answer({ answer: true }),
        answer({ answer: false }),
      ];

      const result = computeInsight('yes_no', answers, {}, t as never);
      const parsed = JSON.parse(result!);

      expect(parsed.key).toBe('surveys.stats.insightMajority');
      expect(parsed.pct).toBe(67);
    });

    it('should report majority no', () => {
      const answers = [
        answer({ answer: false }),
        answer({ answer: false }),
        answer({ answer: true }),
      ];

      const result = computeInsight('yes_no', answers, {}, t as never);
      const parsed = JSON.parse(result!);

      expect(parsed.key).toBe('surveys.stats.insightMajority');
      expect(parsed.pct).toBe(67);
    });

    it('should report equal split', () => {
      const answers = [answer({ answer: true }), answer({ answer: false })];

      const result = computeInsight('yes_no', answers, {}, t as never);
      const parsed = JSON.parse(result!);

      expect(parsed.key).toBe('surveys.stats.insightEqualSplit');
    });

    it('should return null when no boolean answers exist', () => {
      const answers = [answer({ answer: 'maybe' }), answer({ answer: null })];

      expect(computeInsight('yes_no', answers, {}, t as never)).toBeNull();
    });
  });

  it('should return null for open_text', () => {
    const answers = [answer({ text: 'hello' })];
    expect(computeInsight('open_text', answers, {}, t as never)).toBeNull();
  });

  it('should return null for short_text', () => {
    const answers = [answer({ text: 'hello' })];
    expect(computeInsight('short_text', answers, {}, t as never)).toBeNull();
  });
});
