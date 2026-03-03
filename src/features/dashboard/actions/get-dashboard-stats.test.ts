// @vitest-environment node
/** Tests for getDashboardStats — RPC-based read action. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_USER as USER } from '@/test-utils/action-helpers';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
  }),
}));

const mockGetUser = vi.fn();
const mockRpc = vi.fn();

const VALID_STATS = {
  totalResponses: 50,
  prevTotalResponses: 30,
  activeSurveys: 3,
  prevActiveSurveys: 2,
  avgCompletionRate: 0.75,
  prevAvgCompletionRate: 0.6,
  responsesTimeline: [{ date: '2025-01-01', count: 5 }],
  completionTimeline: [{ date: '2025-01-01', completed: 3, inProgress: 1, abandoned: 1 }],
  recentActivity: [
    { type: 'response', title: 'New response', timestamp: '2025-01-01', surveyId: 's1' },
  ],
};

describe('Dashboard Actions – Get Dashboard Stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return stats on success', async () => {
    mockRpc.mockResolvedValue({ data: VALID_STATS, error: null });

    const { getDashboardStats } = await import('./get-dashboard-stats');
    const result = await getDashboardStats(30);

    expect(result).toEqual(VALID_STATS);
    expect(mockRpc).toHaveBeenCalledWith('get_dashboard_stats', {
      p_user_id: USER.id,
      p_days: 30,
    });
  });

  it('should return null when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getDashboardStats } = await import('./get-dashboard-stats');
    const result = await getDashboardStats(30);

    expect(result).toBeNull();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return null on RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const { getDashboardStats } = await import('./get-dashboard-stats');
    const result = await getDashboardStats(30);

    expect(result).toBeNull();
  });

  it('should return null when RPC returns malformed data', async () => {
    mockRpc.mockResolvedValue({ data: { bad: 'shape' }, error: null });

    const { getDashboardStats } = await import('./get-dashboard-stats');
    const result = await getDashboardStats(30);

    expect(result).toBeNull();
  });
});
