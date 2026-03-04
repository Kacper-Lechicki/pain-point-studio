// @vitest-environment node
/** Tests for reordering insights via the reorderInsights action. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Helpers ──────────────────────────────────────────────────────────

import {
  TEST_INSIGHT_ID as INSIGHT_ID,
  TEST_USER as USER,
  chain,
} from '@/test-utils/action-helpers';

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

vi.mock('@/lib/common/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ limited: false }),
}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

const INSIGHT_ID_2 = '00000000-0000-4000-8000-000000000011';
const INSIGHT_ID_3 = '00000000-0000-4000-8000-000000000012';

// ── Tests ────────────────────────────────────────────────────────────

describe('Project Actions – Reorder Insights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should reorder all insights and return success', async () => {
    mockFrom.mockReturnValue(chain());

    const { reorderInsights } = await import('./reorder-insights');
    const result = await reorderInsights({
      insightIds: [INSIGHT_ID, INSIGHT_ID_2, INSIGHT_ID_3],
    });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledTimes(3);
    expect(mockFrom).toHaveBeenCalledWith('project_insights');
  });

  it('should return error when one update fails', async () => {
    mockFrom.mockReturnValueOnce(chain({ error: { message: 'fail' } }));
    mockFrom.mockReturnValue(chain());

    const { reorderInsights } = await import('./reorder-insights');
    const result = await reorderInsights({
      insightIds: [INSIGHT_ID, INSIGHT_ID_2, INSIGHT_ID_3],
    });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid insightIds', async () => {
    const { reorderInsights } = await import('./reorder-insights');
    const result = await reorderInsights({ insightIds: ['not-uuid'] });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
