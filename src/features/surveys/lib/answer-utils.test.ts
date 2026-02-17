/** Tests for isAnswerEmpty across all answer shapes (text, selected, rating, yes/no, unknown). */
import { describe, expect, it } from 'vitest';

import { isAnswerEmpty } from './answer-utils';

// ── text answers ────────────────────────────────────────────────────

describe('isAnswerEmpty – text', () => {
  it('should return true for empty text', () => {
    expect(isAnswerEmpty({ text: '' })).toBe(true);
  });

  it('should return true for whitespace-only text', () => {
    expect(isAnswerEmpty({ text: '   ' })).toBe(true);
  });

  it('should return false for non-empty text', () => {
    expect(isAnswerEmpty({ text: 'Hello' })).toBe(false);
  });
});

// ── selected answers (multiple choice) ──────────────────────────────

describe('isAnswerEmpty – selected', () => {
  it('should return true for empty selected array without other', () => {
    expect(isAnswerEmpty({ selected: [] })).toBe(true);
  });

  it('should return false for non-empty selected array', () => {
    expect(isAnswerEmpty({ selected: ['option-1'] })).toBe(false);
  });

  it('should return true for null selected (fallback)', () => {
    expect(isAnswerEmpty({ selected: null as unknown as string[] })).toBe(true);
  });

  it('should return false when selected is empty but other has a value', () => {
    expect(isAnswerEmpty({ selected: [], other: 'Custom answer' })).toBe(false);
  });

  it('should return true when selected is empty and other is empty string', () => {
    expect(isAnswerEmpty({ selected: [], other: '' })).toBe(true);
  });

  it('should return true when selected is empty and other is whitespace', () => {
    expect(isAnswerEmpty({ selected: [], other: '   ' })).toBe(true);
  });

  it('should return false when both selected and other have values', () => {
    expect(isAnswerEmpty({ selected: ['option-1'], other: 'Custom' })).toBe(false);
  });
});

// ── rating answers ──────────────────────────────────────────────────

describe('isAnswerEmpty – rating', () => {
  it('should return true for null rating', () => {
    expect(isAnswerEmpty({ rating: null })).toBe(true);
  });

  it('should return true for undefined rating', () => {
    expect(isAnswerEmpty({ rating: undefined })).toBe(true);
  });

  it('should return false for numeric rating', () => {
    expect(isAnswerEmpty({ rating: 3 })).toBe(false);
  });

  it('should return false for rating of 0', () => {
    expect(isAnswerEmpty({ rating: 0 })).toBe(false);
  });
});

// ── yes/no answers ──────────────────────────────────────────────────

describe('isAnswerEmpty – answer (yes/no)', () => {
  it('should return true for null answer', () => {
    expect(isAnswerEmpty({ answer: null })).toBe(true);
  });

  it('should return true for undefined answer', () => {
    expect(isAnswerEmpty({ answer: undefined })).toBe(true);
  });

  it('should return false for "yes"', () => {
    expect(isAnswerEmpty({ answer: 'yes' })).toBe(false);
  });

  it('should return false for "no"', () => {
    expect(isAnswerEmpty({ answer: 'no' })).toBe(false);
  });
});

// ── unknown shape ───────────────────────────────────────────────────

describe('isAnswerEmpty – unknown', () => {
  it('should return true for empty object', () => {
    expect(isAnswerEmpty({})).toBe(true);
  });

  it('should return true for unrecognized keys', () => {
    expect(isAnswerEmpty({ foo: 'bar' })).toBe(true);
  });
});
