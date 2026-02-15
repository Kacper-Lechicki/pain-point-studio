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
  responseTimeline: [5, 12, 8, 15],
  totalResponses: 40,
  completedResponses: 35,
  avgSubmissionRate: 87.5,
  categoryBreakdown: [
    { category: 'ux', count: 3, totalResponses: 25 },
    { category: 'pricing', count: 2, totalResponses: 15 },
  ],
  surveyComparison: [
    {
      id: 'survey-1',
      title: 'UX Survey',
      status: 'active',
      category: 'ux',
      completedCount: 20,
      submissionRate: 80,
      questionCount: 5,
      createdAt: '2026-01-15T10:00:00Z',
    },
  ],
};

// ── Tests ───────────────────────────────────────────────────────────

describe('Analytics Actions – Get Analytics Data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    mockRpc.mockResolvedValue({ data: validPayload, error: null });
  });

  // Unauthenticated requests short-circuit to null.
  it('should return null when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getAnalyticsData } = await import('./get-analytics-data');
    const result = await getAnalyticsData();

    expect(result).toBeNull();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  // Calls the correct RPC with the authenticated user's ID.
  it('should call the RPC with the user ID', async () => {
    const { getAnalyticsData } = await import('./get-analytics-data');
    await getAnalyticsData();

    expect(mockRpc).toHaveBeenCalledWith('get_analytics_data', {
      p_user_id: 'user-123',
    });
  });

  // Valid payload passes Zod validation and is returned as-is.
  it('should return parsed data for a valid RPC response', async () => {
    const { getAnalyticsData } = await import('./get-analytics-data');
    const result = await getAnalyticsData();

    expect(result).toEqual(validPayload);
  });

  // RPC error yields null without throwing.
  it('should return null when the RPC returns an error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'rpc failed' } });

    const { getAnalyticsData } = await import('./get-analytics-data');
    const result = await getAnalyticsData();

    expect(result).toBeNull();
  });

  // Null RPC data yields null.
  it('should return null when the RPC returns null data', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { getAnalyticsData } = await import('./get-analytics-data');
    const result = await getAnalyticsData();

    expect(result).toBeNull();
  });

  // Invalid shape fails Zod validation → null.
  it('should return null when the RPC response fails schema validation', async () => {
    mockRpc.mockResolvedValue({
      data: { totalResponses: 'not-a-number' },
      error: null,
    });

    const { getAnalyticsData } = await import('./get-analytics-data');
    const result = await getAnalyticsData();

    expect(result).toBeNull();
  });

  // Invalid survey status fails z.enum(SURVEY_STATUSES) → null.
  it('should return null when a survey has an invalid status', async () => {
    const badPayload = {
      ...validPayload,
      surveyComparison: [{ ...validPayload.surveyComparison[0], status: 'unknown_status' }],
    };

    mockRpc.mockResolvedValue({ data: badPayload, error: null });

    const { getAnalyticsData } = await import('./get-analytics-data');
    const result = await getAnalyticsData();

    expect(result).toBeNull();
  });

  // Missing optional arrays default to empty arrays via Zod .default([]).
  it('should default missing arrays to empty arrays', async () => {
    const minimalPayload = {
      totalResponses: 10,
      completedResponses: 8,
      avgSubmissionRate: 80,
    };

    mockRpc.mockResolvedValue({ data: minimalPayload, error: null });

    const { getAnalyticsData } = await import('./get-analytics-data');
    const result = await getAnalyticsData();

    expect(result).not.toBeNull();
    expect(result!.responseTimeline).toEqual([]);
    expect(result!.categoryBreakdown).toEqual([]);
    expect(result!.surveyComparison).toEqual([]);
  });
});
