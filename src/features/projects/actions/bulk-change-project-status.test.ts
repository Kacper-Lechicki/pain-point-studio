// @vitest-environment node
/** Tests for bulkChangeProjectStatus — pre-validates transitions then calls RPC per project. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Helpers ──────────────────────────────────────────────────────────

import { TEST_USER as USER, chain } from '@/test-utils/action-helpers';

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

vi.mock('@/features/projects/config/status', () => ({
  canTransition: vi.fn().mockReturnValue(true),
}));

const ID1 = '00000000-0000-4000-8000-000000000001';
const ID2 = '00000000-0000-4000-8000-000000000002';

// ── Tests ────────────────────────────────────────────────────────────

describe('Project Actions – Bulk Change Project Status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should succeed for all projects when transitions and RPCs pass', async () => {
    mockFrom.mockReturnValueOnce(
      chain({
        data: [
          { id: ID1, status: 'active' },
          { id: ID2, status: 'active' },
        ],
      })
    );

    mockRpc
      .mockResolvedValueOnce({ data: { success: true }, error: null })
      .mockResolvedValueOnce({ data: { success: true }, error: null });

    const { bulkChangeProjectStatus } = await import('./bulk-change-project-status');
    const result = await bulkChangeProjectStatus({ projectIds: [ID1, ID2], action: 'complete' });

    expect(result).toEqual({
      success: true,
      data: { total: 2, failed: 0, failedIds: [] },
    });

    expect(mockFrom).toHaveBeenCalledWith('projects');
    expect(mockRpc).toHaveBeenCalledTimes(2);

    expect(mockRpc).toHaveBeenCalledWith('change_project_status_with_cascade', {
      p_project_id: ID1,
      p_user_id: USER.id,
      p_action: 'complete',
    });
  });

  it('should return bulkAllFailed when no projects are found', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: [] }));

    const { bulkChangeProjectStatus } = await import('./bulk-change-project-status');
    const result = await bulkChangeProjectStatus({ projectIds: [ID1, ID2], action: 'archive' });

    expect(result).toEqual({
      error: 'projects.errors.bulkAllFailed',
      data: { total: 2, failed: 2, failedIds: [ID1, ID2] },
    });

    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should partially succeed when one transition is invalid', async () => {
    const { canTransition } = await import('@/features/projects/config/status');

    (canTransition as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    mockFrom.mockReturnValueOnce(
      chain({
        data: [
          { id: ID1, status: 'completed' },
          { id: ID2, status: 'active' },
        ],
      })
    );

    mockRpc.mockResolvedValueOnce({ data: { success: true }, error: null });

    const { bulkChangeProjectStatus } = await import('./bulk-change-project-status');
    const result = await bulkChangeProjectStatus({ projectIds: [ID1, ID2], action: 'complete' });

    expect(result).toEqual({
      success: true,
      data: { total: 2, failed: 1, failedIds: [ID1] },
    });

    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it('should partially succeed when one RPC returns an error', async () => {
    mockFrom.mockReturnValueOnce(
      chain({
        data: [
          { id: ID1, status: 'active' },
          { id: ID2, status: 'active' },
        ],
      })
    );

    mockRpc
      .mockResolvedValueOnce({ data: null, error: { message: 'RPC failed' } })
      .mockResolvedValueOnce({ data: { success: true }, error: null });

    const { bulkChangeProjectStatus } = await import('./bulk-change-project-status');
    const result = await bulkChangeProjectStatus({ projectIds: [ID1, ID2], action: 'reopen' });

    expect(result).toEqual({
      success: true,
      data: { total: 2, failed: 1, failedIds: [ID1] },
    });
  });

  it('should return bulkAllFailed when all transitions are invalid', async () => {
    const { canTransition } = await import('@/features/projects/config/status');

    (canTransition as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);

    mockFrom.mockReturnValueOnce(
      chain({
        data: [
          { id: ID1, status: 'trashed' },
          { id: ID2, status: 'trashed' },
        ],
      })
    );

    const { bulkChangeProjectStatus } = await import('./bulk-change-project-status');
    const result = await bulkChangeProjectStatus({ projectIds: [ID1, ID2], action: 'complete' });

    expect(result).toEqual({
      error: 'projects.errors.bulkAllFailed',
      data: { total: 2, failed: 2, failedIds: [ID1, ID2] },
    });

    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return validation error for empty projectIds array', async () => {
    const { bulkChangeProjectStatus } = await import('./bulk-change-project-status');
    const result = await bulkChangeProjectStatus({ projectIds: [], action: 'complete' });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
