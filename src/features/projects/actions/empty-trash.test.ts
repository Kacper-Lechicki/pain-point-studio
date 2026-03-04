// @vitest-environment node
/** Tests for emptying the trash via the emptyTrash action. */
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

// ── Tests ────────────────────────────────────────────────────────────

describe('Project Actions – Empty Trash', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should empty trash and return success', async () => {
    mockFrom.mockReturnValue(chain());

    const { emptyTrash } = await import('./empty-trash');
    const result = await emptyTrash({ projectId: PROJECT_ID });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('project_notes');
  });

  it('should return error when DB returns an error', async () => {
    mockFrom.mockReturnValue(chain({ error: { message: 'db error' } }));

    const { emptyTrash } = await import('./empty-trash');
    const result = await emptyTrash({ projectId: PROJECT_ID });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid projectId', async () => {
    const { emptyTrash } = await import('./empty-trash');
    const result = await emptyTrash({ projectId: 'not-a-uuid' });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
