// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock env
vi.mock('@/lib/common/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'https://example.com',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

// Mock Supabase server client
const mockGetUser = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
  }),
}));

// ── Valid RPC payload ───────────────────────────────────────────────

const validPayload = {
  totalSurveys: 10,
  activeSurveys: 3,
  totalResponses: 120,
  completedResponses: 95,
  avgCompletionRate: 79.2,
  responseTimeline: [5, 12, 8],
  topSurveys: [
    { id: 's1', title: 'Survey 1', status: 'active', completedCount: 50, slug: 'survey-1' },
  ],
  recentResponses: [
    {
      surveyId: 's1',
      surveyTitle: 'Survey 1',
      completedAt: '2024-01-01T00:00:00Z',
      feedback: null,
    },
  ],
};

// ── Tests ───────────────────────────────────────────────────────────

describe('getDashboardOverview', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  async function importFresh() {
    const mod = await import('./get-dashboard-overview');

    return mod.getDashboardOverview;
  }

  it('returns null when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const getDashboardOverview = await importFresh();
    const result = await getDashboardOverview();

    expect(result).toBeNull();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('calls RPC with correct user id', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockRpc.mockResolvedValue({ data: validPayload, error: null });

    const getDashboardOverview = await importFresh();
    await getDashboardOverview();

    expect(mockRpc).toHaveBeenCalledWith('get_dashboard_overview', { p_user_id: 'user-1' });
  });

  it('returns parsed data on valid RPC response', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockRpc.mockResolvedValue({ data: validPayload, error: null });

    const getDashboardOverview = await importFresh();
    const result = await getDashboardOverview();

    expect(result).toEqual(validPayload);
  });

  it('returns null on RPC error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const getDashboardOverview = await importFresh();
    const result = await getDashboardOverview();

    expect(result).toBeNull();
  });

  it('returns null when RPC returns null data', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockRpc.mockResolvedValue({ data: null, error: null });

    const getDashboardOverview = await importFresh();
    const result = await getDashboardOverview();

    expect(result).toBeNull();
  });

  it('returns null when response fails schema validation', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockRpc.mockResolvedValue({
      data: { totalSurveys: 'not-a-number' },
      error: null,
    });

    const getDashboardOverview = await importFresh();
    const result = await getDashboardOverview();

    expect(result).toBeNull();
  });

  it('rejects invalid survey status in topSurveys', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockRpc.mockResolvedValue({
      data: {
        ...validPayload,
        topSurveys: [
          { id: 's1', title: 'Survey 1', status: 'invalid_status', completedCount: 5, slug: null },
        ],
      },
      error: null,
    });

    const getDashboardOverview = await importFresh();
    const result = await getDashboardOverview();

    expect(result).toBeNull();
  });

  it('applies defaults for optional arrays', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockRpc.mockResolvedValue({
      data: {
        totalSurveys: 0,
        activeSurveys: 0,
        totalResponses: 0,
        completedResponses: 0,
        avgCompletionRate: 0,
      },
      error: null,
    });

    const getDashboardOverview = await importFresh();
    const result = await getDashboardOverview();

    expect(result).toEqual({
      totalSurveys: 0,
      activeSurveys: 0,
      totalResponses: 0,
      completedResponses: 0,
      avgCompletionRate: 0,
      responseTimeline: [],
      topSurveys: [],
      recentResponses: [],
    });
  });
});
