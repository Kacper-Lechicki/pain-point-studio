// @vitest-environment node
/** Tests for retrieving translated survey form data (category options). */
import { describe, expect, it, vi } from 'vitest';

import { SURVEY_CATEGORIES } from '@/features/surveys/config/survey-categories';

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));

// ── Tests ────────────────────────────────────────────────────────────

describe('getSurveyFormData', () => {
  it('should return categoryOptions with value and label for each category', async () => {
    const { getSurveyFormData } = await import('./get-survey-form-data');
    const result = await getSurveyFormData();

    expect(result).toHaveProperty('categoryOptions');
    expect(result?.categoryOptions).toHaveLength(SURVEY_CATEGORIES.length);

    expect(result).toBeDefined();
    const options = result!.categoryOptions ?? [];

    for (let i = 0; i < SURVEY_CATEGORIES.length; i++) {
      const opt = options[i];
      const cat = SURVEY_CATEGORIES[i];
      expect(opt).toBeDefined();
      expect(cat).toBeDefined();
      expect(opt).toHaveProperty('value', cat!.value);
      expect(opt).toHaveProperty('label');
      expect(typeof opt!.label).toBe('string');
    }
  });

  it('should use translation for label (mock returns key as label)', async () => {
    const { getSurveyFormData } = await import('./get-survey-form-data');
    const result = await getSurveyFormData();

    expect(result).toBeDefined();
    expect(result!.categoryOptions?.[0]?.label).toBe(SURVEY_CATEGORIES[0]?.labelKey);
  });
});
