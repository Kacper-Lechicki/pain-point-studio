// @vitest-environment node
/** Tests for fetching paginated survey responses via the getSurveyResponses RPC action. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_SURVEY_ID as SURVEY_ID, TEST_USER as USER } from '@/test-utils/action-helpers';

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

vi.mock('@/lib/common/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ limited: false }),
}));

const mockGetUser = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
  }),
}));

// ── Helpers ──────────────────────────────────────────────────────────

const VALID_INPUT = {
  surveyId: SURVEY_ID,
  page: 1,
  perPage: 20,
  sortBy: 'completed_at' as const,
  sortDir: 'desc' as const,
};

const VALID_RESPONSE_ITEM = {
  id: 'resp-1',
  status: 'completed',
  startedAt: '2025-01-01T00:00:00Z',
  completedAt: '2025-01-01T00:05:00Z',
  deviceType: 'desktop',
  durationSeconds: 300,
  contactName: null,
  contactEmail: null,
  answerCount: 5,
  feedback: null,
};

const VALID_RPC_RESULT = {
  items: [VALID_RESPONSE_ITEM],
  totalCount: 1,
};

// ── Tests ────────────────────────────────────────────────────────────

describe('Survey Actions – Get Survey Responses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return responses on success', async () => {
    mockRpc.mockResolvedValue({ data: VALID_RPC_RESULT, error: null });

    const { getSurveyResponses } = await import('./get-survey-responses');
    const result = await getSurveyResponses(VALID_INPUT);

    expect(result).toEqual({
      success: true,
      data: { items: [VALID_RESPONSE_ITEM], totalCount: 1 },
    });

    expect(mockRpc).toHaveBeenCalledWith('get_survey_responses_list', {
      p_survey_id: SURVEY_ID,
      p_user_id: USER.id,
      p_page: 1,
      p_per_page: 20,
      p_sort_by: 'completed_at',
      p_sort_dir: 'desc',
    });
  });

  it('should pass optional filter params when provided', async () => {
    mockRpc.mockResolvedValue({ data: VALID_RPC_RESULT, error: null });

    const { getSurveyResponses } = await import('./get-survey-responses');

    await getSurveyResponses({
      ...VALID_INPUT,
      status: 'completed',
      device: 'mobile',
      hasContact: true,
      search: 'test',
      dateFrom: '2025-01-01',
      dateTo: '2025-01-31',
    });

    expect(mockRpc).toHaveBeenCalledWith('get_survey_responses_list', {
      p_survey_id: SURVEY_ID,
      p_user_id: USER.id,
      p_page: 1,
      p_per_page: 20,
      p_sort_by: 'completed_at',
      p_sort_dir: 'desc',
      p_status: 'completed',
      p_device: 'mobile',
      p_has_contact: true,
      p_search: 'test',
      p_date_from: '2025-01-01',
      p_date_to: '2025-01-31',
    });
  });

  it('should return error when rpc fails', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const { getSurveyResponses } = await import('./get-survey-responses');
    const result = await getSurveyResponses(VALID_INPUT);

    expect(result).toHaveProperty('error', 'surveys.errors.unexpected');
  });

  it('should return error when rpc returns null data', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { getSurveyResponses } = await import('./get-survey-responses');
    const result = await getSurveyResponses(VALID_INPUT);

    expect(result).toHaveProperty('error', 'surveys.errors.unexpected');
  });

  it('should return validation error for invalid surveyId', async () => {
    const { getSurveyResponses } = await import('./get-survey-responses');
    const result = await getSurveyResponses({ ...VALID_INPUT, surveyId: 'not-a-uuid' });

    expect(result.error).toBeDefined();
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
