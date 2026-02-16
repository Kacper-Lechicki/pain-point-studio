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
  it('returns null for empty answers', () => {
    expect(computeInsight('multiple_choice', [], {}, t as never)).toBeNull();
  });

  // ── multiple_choice ───────────────────────────────────────────────

  describe('multiple_choice', () => {
    it('returns top choice when a single winner exists', () => {
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

    it('returns tied choices when multiple options share the top count', () => {
      const answers = [answer({ selected: ['A'] }), answer({ selected: ['B'] })];

      const result = computeInsight('multiple_choice', answers, {}, t as never);
      const parsed = JSON.parse(result!);

      expect(parsed.key).toBe('surveys.stats.insightTiedChoices');
      expect(parsed.options).toBe('A, B');
      expect(parsed.pct).toBe(50);
    });

    it('includes "other" answers in counts', () => {
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

    it('returns null when all selections are empty arrays', () => {
      const answers = [answer({ selected: [] }), answer({ selected: [] })];

      expect(computeInsight('multiple_choice', answers, {}, t as never)).toBeNull();
    });
  });

  // ── rating_scale ──────────────────────────────────────────────────

  describe('rating_scale', () => {
    it('computes average rating with default max', () => {
      const answers = [answer({ rating: 3 }), answer({ rating: 5 }), answer({ rating: 4 })];

      const result = computeInsight('rating_scale', answers, {}, t as never);
      const parsed = JSON.parse(result!);

      expect(parsed.key).toBe('surveys.stats.insightAvgRating');
      expect(parsed.value).toBe('4.0');
      expect(parsed.max).toBe(5);
    });

    it('uses config.max when provided', () => {
      const answers = [answer({ rating: 7 }), answer({ rating: 9 })];

      const result = computeInsight('rating_scale', answers, { max: 10 }, t as never);
      const parsed = JSON.parse(result!);

      expect(parsed.max).toBe(10);
      expect(parsed.value).toBe('8.0');
    });

    it('returns null when no valid ratings exist', () => {
      const answers = [answer({ rating: undefined }), answer({ rating: 'bad' })];

      expect(computeInsight('rating_scale', answers, {}, t as never)).toBeNull();
    });
  });

  // ── yes_no ────────────────────────────────────────────────────────

  describe('yes_no', () => {
    it('reports majority yes', () => {
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

    it('reports majority no', () => {
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

    it('reports equal split', () => {
      const answers = [answer({ answer: true }), answer({ answer: false })];

      const result = computeInsight('yes_no', answers, {}, t as never);
      const parsed = JSON.parse(result!);

      expect(parsed.key).toBe('surveys.stats.insightEqualSplit');
    });

    it('returns null when no boolean answers exist', () => {
      const answers = [answer({ answer: 'maybe' }), answer({ answer: null })];

      expect(computeInsight('yes_no', answers, {}, t as never)).toBeNull();
    });
  });

  // ── text types ────────────────────────────────────────────────────

  it('returns null for open_text', () => {
    const answers = [answer({ text: 'hello' })];
    expect(computeInsight('open_text', answers, {}, t as never)).toBeNull();
  });

  it('returns null for short_text', () => {
    const answers = [answer({ text: 'hello' })];
    expect(computeInsight('short_text', answers, {}, t as never)).toBeNull();
  });
});
