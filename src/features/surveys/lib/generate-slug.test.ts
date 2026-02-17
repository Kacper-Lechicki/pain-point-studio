/** Tests for survey slug generation and title slugification. */
import { describe, expect, it } from 'vitest';

import { generateSurveySlug, slugifyTitle } from './generate-slug';

// ── generateSurveySlug ──────────────────────────────────────────────

describe('generateSurveySlug', () => {
  it('should return a 10-character string', () => {
    const slug = generateSurveySlug();

    expect(slug).toHaveLength(10);
  });

  it('should generate unique slugs', () => {
    const slugs = new Set(Array.from({ length: 100 }, () => generateSurveySlug()));

    expect(slugs.size).toBe(100);
  });
});

// ── slugifyTitle ────────────────────────────────────────────────────

describe('slugifyTitle', () => {
  it('should lowercase and replace spaces with hyphens', () => {
    expect(slugifyTitle('My Survey Title')).toBe('my-survey-title');
  });

  it('should remove special characters', () => {
    expect(slugifyTitle('Survey #1 (Test!)')).toBe('survey-1-test-');
  });

  it('should truncate to default maxLength of 30', () => {
    const long = 'this is a very long survey title that exceeds thirty characters';
    const result = slugifyTitle(long);

    expect(result.length).toBeLessThanOrEqual(30);
  });

  it('should respect custom maxLength', () => {
    const result = slugifyTitle('Some Title Here', 10);

    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('should handle empty string', () => {
    expect(slugifyTitle('')).toBe('');
  });

  it('should collapse consecutive non-alphanumeric chars', () => {
    expect(slugifyTitle('foo---bar')).toBe('foo-bar');
  });
});
