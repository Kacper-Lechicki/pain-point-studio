// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_SURVEY_ID as SURVEY_ID, TEST_USER as USER, chain } from '@/test-utils/action-helpers';

vi.mock('@/lib/common/env', () => ({
  env: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_APP_URL: 'https://example.com',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  },
}));

vi.mock('@/lib/common/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ limited: false }),
}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

const VALID_INPUT = {
  surveyId: SURVEY_ID,
  generateInsights: true,
};

describe('Project Actions – Set Survey Insight Preference', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should update preference and return success', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: { id: SURVEY_ID } }));

    const { setSurveyInsightPreference } = await import('./set-survey-insight-preference');
    const result = await setSurveyInsightPreference(VALID_INPUT);

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('surveys');
  });

  it('should return error when survey not found', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null }));

    const { setSurveyInsightPreference } = await import('./set-survey-insight-preference');
    const result = await setSurveyInsightPreference(VALID_INPUT);

    expect(result).toHaveProperty('error', 'surveys.errors.unexpected');
  });

  it('should return error on update failure', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null, error: { message: 'Update failed' } }));

    const { setSurveyInsightPreference } = await import('./set-survey-insight-preference');
    const result = await setSurveyInsightPreference(VALID_INPUT);

    expect(result).toHaveProperty('error', 'surveys.errors.unexpected');
  });

  it('should work with generateInsights set to false', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: { id: SURVEY_ID } }));

    const { setSurveyInsightPreference } = await import('./set-survey-insight-preference');
    const result = await setSurveyInsightPreference({
      surveyId: SURVEY_ID,
      generateInsights: false,
    });

    expect(result).toEqual({ success: true });
  });

  it('should return validation error for invalid data', async () => {
    const { setSurveyInsightPreference } = await import('./set-survey-insight-preference');

    const result = await setSurveyInsightPreference({
      surveyId: 'not-a-uuid',
      generateInsights: true,
    });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
