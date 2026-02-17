/** Tests for the STOPWORDS set contents and expected membership. */
import { describe, expect, it } from 'vitest';

import { STOPWORDS } from './stopwords';

describe('STOPWORDS', () => {
  it('should be a Set', () => {
    expect(STOPWORDS).toBeInstanceOf(Set);
  });

  it('should contain common English stopwords', () => {
    expect(STOPWORDS.has('the')).toBe(true);
    expect(STOPWORDS.has('and')).toBe(true);
    expect(STOPWORDS.has('is')).toBe(true);
    expect(STOPWORDS.has('a')).toBe(true);
  });

  it('should have reasonable size (over 50 entries)', () => {
    expect(STOPWORDS.size).toBeGreaterThan(50);
  });

  it('should not contain meaningful content words', () => {
    expect(STOPWORDS.has('survey')).toBe(false);
    expect(STOPWORDS.has('feedback')).toBe(false);
    expect(STOPWORDS.has('question')).toBe(false);
  });
});
