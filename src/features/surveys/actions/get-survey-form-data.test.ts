// @vitest-environment node
/** Tests for retrieving translated survey form data (category options). */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SURVEY_CATEGORIES } from '@/features/surveys/config/survey-categories';

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock('@/lib/common/env', () => ({
  env: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_APP_URL: 'https://example.com',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  },
}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));

// Ensure createClient path doesn't trigger env; from() returns empty projects by default
beforeEach(() => {
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [] }),
  });
});

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
