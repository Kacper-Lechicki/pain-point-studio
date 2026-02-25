// @vitest-environment node
/** Tests for listing the authenticated user's surveys via the getUserSurveys RPC. */
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

function makeSurveyRow(overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    title: 'Survey',
    description: '',
    status: 'draft',
    slug: null,
    responseCount: 0,
    completedCount: 0,
    questionCount: 0,
    recentActivity: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    lastResponseAt: null,
    startsAt: null,
    endsAt: null,
    maxRespondents: null,
    archivedAt: null,
    cancelledAt: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    avgCompletionSeconds: null,
    avgQuestionCompletion: null,
    projectId: null,
    projectName: null,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('getUserSurveys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return null when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getUserSurveys } = await import('./get-user-surveys');
    const result = await getUserSurveys();

    expect(result).toBeNull();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return null when rpc returns error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const { getUserSurveys } = await import('./get-user-surveys');
    const result = await getUserSurveys();

    expect(result).toBeNull();
  });

  it('should return empty array when rpc returns null data', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { getUserSurveys } = await import('./get-user-surveys');
    const result = await getUserSurveys();

    expect(result).toEqual([]);
  });

  it('should return parsed survey list on rpc success', async () => {
    const row = makeSurveyRow({ title: 'My Survey' });
    mockRpc.mockResolvedValue({ data: [row], error: null });

    const { getUserSurveys } = await import('./get-user-surveys');
    const result = await getUserSurveys();

    expect(result).toHaveLength(1);
    expect(result?.[0]).toMatchObject({ title: 'My Survey' });

    expect(mockRpc).toHaveBeenCalledWith('get_user_surveys_with_counts', {
      p_user_id: USER.id,
    });
  });

  it('should return null when rpc data fails schema validation', async () => {
    mockRpc.mockResolvedValue({
      data: [{ id: 'only-id-no-other-fields' }],
      error: null,
    });

    const { getUserSurveys } = await import('./get-user-surveys');
    const result = await getUserSurveys();

    expect(result).toBeNull();
  });
});
