import { describe, expect, it } from 'vitest';

import { generateSurveySlug, slugifyTitle } from './generate-slug';

describe('generateSurveySlug', () => {
  it('returns a 10-character string', () => {
    const slug = generateSurveySlug();

    expect(slug).toHaveLength(10);
  });

  it('generates unique slugs', () => {
    const slugs = new Set(Array.from({ length: 100 }, () => generateSurveySlug()));

    expect(slugs.size).toBe(100);
  });
});

describe('slugifyTitle', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugifyTitle('My Survey Title')).toBe('my-survey-title');
  });

  it('removes special characters', () => {
    expect(slugifyTitle('Survey #1 (Test!)')).toBe('survey-1-test-');
  });

  it('truncates to default maxLength of 30', () => {
    const long = 'this is a very long survey title that exceeds thirty characters';
    const result = slugifyTitle(long);

    expect(result.length).toBeLessThanOrEqual(30);
  });

  it('respects custom maxLength', () => {
    const result = slugifyTitle('Some Title Here', 10);

    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('handles empty string', () => {
    expect(slugifyTitle('')).toBe('');
  });

  it('collapses consecutive non-alphanumeric chars', () => {
    expect(slugifyTitle('foo---bar')).toBe('foo-bar');
  });
});
