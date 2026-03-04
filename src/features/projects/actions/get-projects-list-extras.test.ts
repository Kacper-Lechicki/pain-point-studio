// @vitest-environment node
/** Tests for getProjectsListExtras — RPC-based read action. */
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

const VALID_EXTRAS = {
  'proj-1': {
    draftCount: 1,
    activeCount: 2,
    completedCount: 3,
    nearestEndsAt: '2025-02-01',
    sparkline: [{ date: '2025-01-01', count: 5 }],
  },
};

describe('Project Actions – Get Projects List Extras', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return extras map on success', async () => {
    mockRpc.mockResolvedValue({ data: VALID_EXTRAS, error: null });

    const { getProjectsListExtras } = await import('./get-projects-list-extras');
    const result = await getProjectsListExtras();

    expect(result).toEqual(VALID_EXTRAS);
    expect(mockRpc).toHaveBeenCalledWith('get_projects_list_extras', { p_user_id: USER.id });
  });

  it('should return null when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getProjectsListExtras } = await import('./get-projects-list-extras');
    const result = await getProjectsListExtras();

    expect(result).toBeNull();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return null on RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const { getProjectsListExtras } = await import('./get-projects-list-extras');
    const result = await getProjectsListExtras();

    expect(result).toBeNull();
  });

  it('should return null when RPC returns malformed data', async () => {
    mockRpc.mockResolvedValue({
      data: { 'proj-1': { bad: 'shape' } },
      error: null,
    });

    const { getProjectsListExtras } = await import('./get-projects-list-extras');
    const result = await getProjectsListExtras();

    expect(result).toBeNull();
  });
});
