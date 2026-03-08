// @vitest-environment node
/** Tests for getProjectOverviewStats — RPC-based read action. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_PROJECT_ID as PROJECT_ID, TEST_USER as USER } from '@/test-utils/action-helpers';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
  }),
}));

const mockGetUser = vi.fn();
const mockRpc = vi.fn();

const VALID_STATS = {
  totalSurveys: 5,
  activeSurveys: 2,
  totalResponses: 100,
  avgCompletion: 0.85,
  avgTimeSeconds: 120,
  lastResponseAt: '2025-01-01',
  recentActivity: [
    { type: 'response', title: 'New response', timestamp: '2025-01-01', surveyId: 's1' },
  ],
  responsesTimeline: [{ date: '2025-01-01', count: 5 }],
  surveyStatusDistribution: { draft: 1, active: 2, completed: 2, cancelled: 0, archived: 0 },
  completionBreakdown: { completed: 70, inProgress: 20, abandoned: 10 },
};

describe('Project Actions – Get Project Overview Stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return stats on success', async () => {
    mockRpc.mockResolvedValue({ data: VALID_STATS, error: null });

    const { getProjectOverviewStats } = await import('./get-project-overview-stats');
    const result = await getProjectOverviewStats(PROJECT_ID);

    expect(result).toEqual(VALID_STATS);
    expect(mockRpc).toHaveBeenCalledWith('get_project_detail_stats', {
      p_project_id: PROJECT_ID,
      p_user_id: USER.id,
    });
  });

  it('should return null when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getProjectOverviewStats } = await import('./get-project-overview-stats');
    const result = await getProjectOverviewStats(PROJECT_ID);

    expect(result).toBeNull();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return null on RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const { getProjectOverviewStats } = await import('./get-project-overview-stats');
    const result = await getProjectOverviewStats(PROJECT_ID);

    expect(result).toBeNull();
  });

  it('should return null when RPC returns malformed data', async () => {
    mockRpc.mockResolvedValue({ data: { bad: 'shape' }, error: null });

    const { getProjectOverviewStats } = await import('./get-project-overview-stats');
    const result = await getProjectOverviewStats(PROJECT_ID);

    expect(result).toBeNull();
  });
});
