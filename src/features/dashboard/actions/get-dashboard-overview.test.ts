// @vitest-environment node
/** Tests for getDashboardOverview — RPC-based read action. */
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

describe('Dashboard Actions – Get Dashboard Overview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return overview on success', async () => {
    const rpcData = [
      {
        id: '1',
        name: 'Proj',
        summary: null,
        status: 'active',
        updatedAt: '2025-01-01',
        surveyCount: 2,
        responseCount: 10,
      },
    ];

    mockRpc.mockResolvedValue({ data: rpcData, error: null });

    const { getDashboardOverview } = await import('./get-dashboard-overview');
    const result = await getDashboardOverview();

    expect(result).toEqual({ projects: rpcData });
    expect(mockRpc).toHaveBeenCalledWith('get_dashboard_overview', { p_user_id: USER.id });
  });

  it('should return null when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getDashboardOverview } = await import('./get-dashboard-overview');
    const result = await getDashboardOverview();

    expect(result).toBeNull();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return null on RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const { getDashboardOverview } = await import('./get-dashboard-overview');
    const result = await getDashboardOverview();

    expect(result).toBeNull();
  });

  it('should return null when RPC returns malformed data', async () => {
    mockRpc.mockResolvedValue({ data: [{ bad: 'shape' }], error: null });

    const { getDashboardOverview } = await import('./get-dashboard-overview');
    const result = await getDashboardOverview();

    expect(result).toBeNull();
  });
});
