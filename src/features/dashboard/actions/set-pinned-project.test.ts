// @vitest-environment node
/** Tests for setPinnedProject — protected action. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Helpers ──────────────────────────────────────────────────────────

import {
  TEST_PROJECT_ID as PROJECT_ID,
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

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// ── Tests ────────────────────────────────────────────────────────────

describe('Dashboard Actions – Set Pinned Project', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should pin a project and return success', async () => {
    mockFrom.mockReturnValue(chain({ data: {} }));

    const { setPinnedProject } = await import('./set-pinned-project');
    const result = await setPinnedProject({ projectId: PROJECT_ID });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('profiles');
  });

  it('should unpin (null projectId) and return success', async () => {
    mockFrom.mockReturnValue(chain({ data: {} }));

    const { setPinnedProject } = await import('./set-pinned-project');
    const result = await setPinnedProject({ projectId: null });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('profiles');
  });

  it('should return validation error for invalid projectId', async () => {
    const { setPinnedProject } = await import('./set-pinned-project');
    const result = await setPinnedProject({ projectId: 'not-a-uuid' });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should return error when DB update fails', async () => {
    mockFrom.mockReturnValue(chain({ error: { message: 'DB error' } }));

    const { setPinnedProject } = await import('./set-pinned-project');
    const result = await setPinnedProject({ projectId: PROJECT_ID });

    expect(result).toHaveProperty('error', 'common.errors.unexpected');
  });
});
