// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
  }),
}));

// ── Helpers ──────────────────────────────────────────────────────────

const USER = { id: 'user-123', email: 'test@example.com' };
const SURVEY_ID = '00000000-0000-4000-8000-000000000001';

const VALID_RPC_DATA = {
  survey: {
    id: SURVEY_ID,
    title: 'My Survey',
    slug: 'my-survey',
    status: 'active',
    startsAt: null,
    endsAt: null,
    maxRespondents: 100,
  },
  totalResponses: 10,
  completedResponses: 8,
  inProgressResponses: 2,
  responseTimeline: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  avgCompletionSeconds: 120,
  firstResponseAt: '2025-01-01T00:00:00Z',
  lastResponseAt: '2025-01-10T00:00:00Z',
  deviceTimeline: [{ desktop: 6, mobile: 4 }],
  questions: [
    {
      id: 'q1',
      text: 'Q1?',
      type: 'open_text',
      sortOrder: 0,
      config: {},
      answers: [{ value: {}, completedAt: '2025-01-01T00:00:00Z' }],
    },
  ],
};

// ── Tests ────────────────────────────────────────────────────────────

describe('getSurveyStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  // No user → null; rpc not called.
  it('returns null when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getSurveyStats } = await import('./get-survey-stats');
    const result = await getSurveyStats(SURVEY_ID);

    expect(result).toBeNull();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  // RPC error → null.
  it('returns null when rpc returns error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const { getSurveyStats } = await import('./get-survey-stats');
    const result = await getSurveyStats(SURVEY_ID);

    expect(result).toBeNull();
  });

  // RPC data null → null.
  it('returns null when rpc returns null data', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { getSurveyStats } = await import('./get-survey-stats');
    const result = await getSurveyStats(SURVEY_ID);

    expect(result).toBeNull();
  });

  // Valid rpc data → parsed survey, totalResponses, questions; rpc with p_survey_id, p_user_id.
  it('returns parsed stats on rpc success with valid shape', async () => {
    mockRpc.mockResolvedValue({ data: VALID_RPC_DATA, error: null });

    const { getSurveyStats } = await import('./get-survey-stats');
    const result = await getSurveyStats(SURVEY_ID);

    expect(result).not.toBeNull();
    expect(result?.survey).toMatchObject({
      id: SURVEY_ID,
      title: 'My Survey',
      slug: 'my-survey',
      status: 'active',
    });
    expect(result?.totalResponses).toBe(10);
    expect(result?.questions).toHaveLength(1);
    expect(mockRpc).toHaveBeenCalledWith('get_survey_stats_data', {
      p_survey_id: SURVEY_ID,
      p_user_id: USER.id,
    });
  });

  // Invalid shape → null.
  it('returns null when rpc data fails schema validation', async () => {
    mockRpc.mockResolvedValue({
      data: { survey: {}, totalResponses: 'not-a-number' },
      error: null,
    });

    const { getSurveyStats } = await import('./get-survey-stats');
    const result = await getSurveyStats(SURVEY_ID);

    expect(result).toBeNull();
  });
});
