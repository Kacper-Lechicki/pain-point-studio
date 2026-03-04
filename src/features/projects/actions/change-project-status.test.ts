// @vitest-environment node
/** Tests for changeProjectStatus — calls RPC with action enum. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Helpers ──────────────────────────────────────────────────────────

import { TEST_PROJECT_ID as PROJECT_ID, TEST_USER as USER } from '@/test-utils/action-helpers';

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
const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
  }),
}));

// ── Tests ────────────────────────────────────────────────────────────

describe('Project Actions – Change Project Status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should change status via RPC and return success', async () => {
    mockRpc.mockResolvedValue({ data: { success: true }, error: null });

    const { changeProjectStatus } = await import('./change-project-status');
    const result = await changeProjectStatus({ projectId: PROJECT_ID, action: 'complete' });

    expect(result).toEqual({ success: true });
    expect(mockRpc).toHaveBeenCalledWith('change_project_status_with_cascade', {
      p_project_id: PROJECT_ID,
      p_user_id: USER.id,
      p_action: 'complete',
    });
  });

  it('should return error when RPC returns error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } });

    const { changeProjectStatus } = await import('./change-project-status');
    const result = await changeProjectStatus({ projectId: PROJECT_ID, action: 'archive' });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return domain error when RPC result contains error key', async () => {
    mockRpc.mockResolvedValue({ data: { error: 'some.error.key' }, error: null });

    const { changeProjectStatus } = await import('./change-project-status');
    const result = await changeProjectStatus({ projectId: PROJECT_ID, action: 'reopen' });

    expect(result).toEqual({ error: 'some.error.key' });
  });

  it('should return validation error for invalid action', async () => {
    const { changeProjectStatus } = await import('./change-project-status');

    const result = await changeProjectStatus({
      projectId: PROJECT_ID,
      action: 'invalid' as 'complete',
    });

    expect(result.error).toBeDefined();
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
