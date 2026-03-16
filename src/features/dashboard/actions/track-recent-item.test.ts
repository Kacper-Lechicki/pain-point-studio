// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_PROJECT_ID as PROJECT_ID, TEST_USER as USER } from '@/test-utils/action-helpers';

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

describe('trackRecentItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
    mockRpc.mockResolvedValue({ data: undefined, error: null });
  });

  it('should call upsert_recent_item RPC and return success', async () => {
    const { trackRecentItem } = await import('./track-recent-item');
    const result = await trackRecentItem({ itemId: PROJECT_ID, itemType: 'project' });

    expect(result).toEqual({ success: true });
    expect(mockRpc).toHaveBeenCalledWith('upsert_recent_item', {
      p_item_id: PROJECT_ID,
      p_item_type: 'project',
    });
  });

  it('should accept survey item type', async () => {
    const { trackRecentItem } = await import('./track-recent-item');
    const result = await trackRecentItem({ itemId: PROJECT_ID, itemType: 'survey' });

    expect(result).toEqual({ success: true });
    expect(mockRpc).toHaveBeenCalledWith('upsert_recent_item', {
      p_item_id: PROJECT_ID,
      p_item_type: 'survey',
    });
  });

  it('should return validation error for invalid itemId', async () => {
    const { trackRecentItem } = await import('./track-recent-item');
    const result = await trackRecentItem({ itemId: 'not-a-uuid', itemType: 'project' });

    expect(result.error).toBeDefined();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return validation error for invalid itemType', async () => {
    const { trackRecentItem } = await import('./track-recent-item');
    const result = await trackRecentItem({
      itemId: PROJECT_ID,
      itemType: 'invalid' as 'project',
    });

    expect(result.error).toBeDefined();
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
