import { describe, expect, it } from 'vitest';

import { STOPWORDS } from './stopwords';

// ── STOPWORDS ───────────────────────────────────────────────────────

describe('STOPWORDS', () => {
  // STOPWORDS is a Set instance.
  it('is a Set', () => {
    expect(STOPWORDS).toBeInstanceOf(Set);
  });

  // Contains common words: the, and, is, a.
  it('contains common English stopwords', () => {
    expect(STOPWORDS.has('the')).toBe(true);
    expect(STOPWORDS.has('and')).toBe(true);
    expect(STOPWORDS.has('is')).toBe(true);
    expect(STOPWORDS.has('a')).toBe(true);
  });

  // Set has more than 50 entries.
  it('has reasonable size (over 50 entries)', () => {
    expect(STOPWORDS.size).toBeGreaterThan(50);
  });

  // Does not contain survey, feedback, question.
  it('does not contain meaningful content words', () => {
    expect(STOPWORDS.has('survey')).toBe(false);
    expect(STOPWORDS.has('feedback')).toBe(false);
    expect(STOPWORDS.has('question')).toBe(false);
  });
});
