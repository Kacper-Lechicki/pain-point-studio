// @vitest-environment node
/** Tests for checkSurveyStatus — plain async function with manual rate-limit. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Helpers ──────────────────────────────────────────────────────────

import { TEST_SURVEY_ID as SURVEY_ID, chain } from '@/test-utils/action-helpers';

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

const mockRateLimit = vi.fn().mockResolvedValue({ limited: false });

vi.mock('@/lib/common/rate-limit', () => ({
  rateLimit: mockRateLimit,
}));

const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: mockFrom,
  }),
}));

// ── Tests ────────────────────────────────────────────────────────────

describe('Respondent Actions – Check Survey Status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ limited: false });
  });

  it('should return survey status string on success', async () => {
    mockFrom.mockReturnValue(chain({ data: { status: 'active' } }));

    const { checkSurveyStatus } = await import('./check-survey-status');
    const result = await checkSurveyStatus(SURVEY_ID);

    expect(result).toBe('active');
    expect(mockFrom).toHaveBeenCalledWith('surveys');
  });

  it('should return null when rate limited', async () => {
    mockRateLimit.mockResolvedValue({ limited: true });

    const { checkSurveyStatus } = await import('./check-survey-status');
    const result = await checkSurveyStatus(SURVEY_ID);

    expect(result).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should return null when survey not found', async () => {
    mockFrom.mockReturnValue(chain({ data: null }));

    const { checkSurveyStatus } = await import('./check-survey-status');
    const result = await checkSurveyStatus(SURVEY_ID);

    expect(result).toBeNull();
  });

  it('should return null on query error', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'fail' } }));

    const { checkSurveyStatus } = await import('./check-survey-status');
    const result = await checkSurveyStatus(SURVEY_ID);

    expect(result).toBeNull();
  });
});
