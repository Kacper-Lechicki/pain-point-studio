import { describe, expect, it } from 'vitest';

import { SURVEY_CATEGORIES, SURVEY_CATEGORY_VALUES } from './survey-categories';

describe('SURVEY_CATEGORIES', () => {
  it('has at least one category', () => {
    expect(SURVEY_CATEGORIES.length).toBeGreaterThan(0);
  });

  it('each entry has value and labelKey', () => {
    for (const cat of SURVEY_CATEGORIES) {
      expect(cat.value).toBeTruthy();
      expect(cat.labelKey).toMatch(/^surveys\.categories\./);
    }
  });

  it('has no duplicate values', () => {
    const values = SURVEY_CATEGORIES.map((c) => c.value);
    const unique = new Set(values);

    expect(unique.size).toBe(values.length);
  });

  it('includes expected categories', () => {
    const values = SURVEY_CATEGORIES.map((c) => c.value);

    expect(values).toContain('problem-validation');
    expect(values).toContain('market-demand');
    expect(values).toContain('other');
  });
});

describe('SURVEY_CATEGORY_VALUES', () => {
  it('matches SURVEY_CATEGORIES values', () => {
    const expected = SURVEY_CATEGORIES.map((c) => c.value);

    expect(SURVEY_CATEGORY_VALUES).toEqual(expected);
  });
});
