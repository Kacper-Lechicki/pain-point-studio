import { describe, expect, it } from 'vitest';

import { isAnswerEmpty } from './answer-utils';

// ── text answers ────────────────────────────────────────────────────

describe('isAnswerEmpty – text', () => {
  it('returns true for empty text', () => {
    expect(isAnswerEmpty({ text: '' })).toBe(true);
  });

  it('returns true for whitespace-only text', () => {
    expect(isAnswerEmpty({ text: '   ' })).toBe(true);
  });

  it('returns false for non-empty text', () => {
    expect(isAnswerEmpty({ text: 'Hello' })).toBe(false);
  });
});

// ── selected answers (multiple choice) ──────────────────────────────

describe('isAnswerEmpty – selected', () => {
  it('returns true for empty selected array', () => {
    expect(isAnswerEmpty({ selected: [] })).toBe(true);
  });

  it('returns false for non-empty selected array', () => {
    expect(isAnswerEmpty({ selected: ['option-1'] })).toBe(false);
  });

  it('returns true for null selected (fallback)', () => {
    expect(isAnswerEmpty({ selected: null as unknown as string[] })).toBe(true);
  });
});

// ── rating answers ──────────────────────────────────────────────────

describe('isAnswerEmpty – rating', () => {
  it('returns true for null rating', () => {
    expect(isAnswerEmpty({ rating: null })).toBe(true);
  });

  it('returns true for undefined rating', () => {
    expect(isAnswerEmpty({ rating: undefined })).toBe(true);
  });

  it('returns false for numeric rating', () => {
    expect(isAnswerEmpty({ rating: 3 })).toBe(false);
  });

  it('returns false for rating of 0', () => {
    expect(isAnswerEmpty({ rating: 0 })).toBe(false);
  });
});

// ── yes/no answers ──────────────────────────────────────────────────

describe('isAnswerEmpty – answer (yes/no)', () => {
  it('returns true for null answer', () => {
    expect(isAnswerEmpty({ answer: null })).toBe(true);
  });

  it('returns true for undefined answer', () => {
    expect(isAnswerEmpty({ answer: undefined })).toBe(true);
  });

  it('returns false for "yes"', () => {
    expect(isAnswerEmpty({ answer: 'yes' })).toBe(false);
  });

  it('returns false for "no"', () => {
    expect(isAnswerEmpty({ answer: 'no' })).toBe(false);
  });
});

// ── unknown shape ───────────────────────────────────────────────────

describe('isAnswerEmpty – unknown', () => {
  it('returns true for empty object', () => {
    expect(isAnswerEmpty({})).toBe(true);
  });

  it('returns true for unrecognized keys', () => {
    expect(isAnswerEmpty({ foo: 'bar' })).toBe(true);
  });
});
