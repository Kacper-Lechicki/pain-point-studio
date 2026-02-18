/** Tests for survey category definitions and the derived SURVEY_CATEGORY_VALUES array. */
import { describe, expect, it } from 'vitest';

import { SURVEY_CATEGORIES, SURVEY_CATEGORY_VALUES } from './survey-categories';

describe('SURVEY_CATEGORIES', () => {
  it('should have at least one category', () => {
    expect(SURVEY_CATEGORIES.length).toBeGreaterThan(0);
  });

  it('should have value and labelKey in each entry', () => {
    for (const cat of SURVEY_CATEGORIES) {
      expect(cat.value).toBeTruthy();
      expect(cat.labelKey).toMatch(/^surveys\.categories\./);
    }
  });

  it('should have no duplicate values', () => {
    const values = SURVEY_CATEGORIES.map((c) => c.value);
    const unique = new Set(values);

    expect(unique.size).toBe(values.length);
  });

  it('should include expected categories', () => {
    const values = SURVEY_CATEGORIES.map((c) => c.value);

    expect(values).toContain('project-idea-evaluation');
  });
});

describe('SURVEY_CATEGORY_VALUES', () => {
  it('should match SURVEY_CATEGORIES values', () => {
    const expected = SURVEY_CATEGORIES.map((c) => c.value);

    expect(SURVEY_CATEGORY_VALUES).toEqual(expected);
  });
});
