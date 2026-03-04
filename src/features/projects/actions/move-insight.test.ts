// @vitest-environment node
/** Tests for moving an insight between columns via the moveInsight action. */
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

const TARGET_ID_1 = '00000000-0000-4000-8000-000000000011';
const TARGET_ID_2 = '00000000-0000-4000-8000-000000000012';
const SOURCE_ID_1 = '00000000-0000-4000-8000-000000000013';
const SOURCE_ID_2 = '00000000-0000-4000-8000-000000000014';

const VALID_INPUT = {
  insightId: INSIGHT_ID,
  newType: 'opportunity' as const,
  targetColumnInsightIds: [TARGET_ID_1, TARGET_ID_2],
  sourceColumnInsightIds: [SOURCE_ID_1, SOURCE_ID_2],
};

// ── Tests ────────────────────────────────────────────────────────────

describe('Project Actions – Move Insight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should move insight and reindex both columns', async () => {
    // 1 type update + 2 target reindex + 2 source reindex = 5 calls
    mockFrom.mockReturnValue(chain());

    const { moveInsight } = await import('./move-insight');
    const result = await moveInsight(VALID_INPUT);

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledTimes(5);
    expect(mockFrom).toHaveBeenCalledWith('project_insights');
  });

  it('should return error when type update fails', async () => {
    // First call (type update) fails
    mockFrom.mockReturnValueOnce(chain({ error: { message: 'fail' } }));
    mockFrom.mockReturnValue(chain());

    const { moveInsight } = await import('./move-insight');
    const result = await moveInsight(VALID_INPUT);

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
    // Type update is the only call — reindex should not happen
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('should return error when reindex fails', async () => {
    // First call (type update) succeeds
    mockFrom.mockReturnValueOnce(chain());
    // Second call (first reindex) fails
    mockFrom.mockReturnValueOnce(chain({ error: { message: 'fail' } }));
    // Remaining reindex calls succeed
    mockFrom.mockReturnValue(chain());

    const { moveInsight } = await import('./move-insight');
    const result = await moveInsight(VALID_INPUT);

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid insightId', async () => {
    const { moveInsight } = await import('./move-insight');
    const result = await moveInsight({ ...VALID_INPUT, insightId: 'not-a-uuid' });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
