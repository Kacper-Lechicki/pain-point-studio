// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_USER as USER } from '@/test-utils/action-helpers';

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

describe('getRecentItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getRecentItems } = await import('./get-recent-items');
    const result = await getRecentItems('project');

    expect(result).toEqual([]);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should call get_recent_items RPC and return results', async () => {
    mockGetUser.mockResolvedValue({ data: { user: USER } });

    const mockData = [
      { id: 'abc', label: 'Project A', imageUrl: null, type: 'project', visited_at: '2026-01-01' },
    ];
    mockRpc.mockResolvedValue({ data: mockData, error: null });

    const { getRecentItems } = await import('./get-recent-items');
    const result = await getRecentItems('project');

    expect(result).toEqual(mockData);
    expect(mockRpc).toHaveBeenCalledWith('get_recent_items', {
      p_item_type: 'project',
      p_limit: 5,
      p_project_id: null,
    });
  });

  it('should return empty array on RPC error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: USER } });
    mockRpc.mockResolvedValue({ data: null, error: { message: 'error' } });

    const { getRecentItems } = await import('./get-recent-items');
    const result = await getRecentItems('survey');

    expect(result).toEqual([]);
  });
});
