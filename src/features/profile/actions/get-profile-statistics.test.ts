// @vitest-environment node
/** Tests for getProfileStatistics server action covering auth, RPC calls, and schema validation. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/common/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'https://example.com',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
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

// ── Valid RPC payload ───────────────────────────────────────────────

const validPayload = {
  totalSurveys: 12,
  totalResponses: 85,
  avgSubmissionRate: 72.5,
  memberSince: '2024-03-15T00:00:00Z',
};

// ── Tests ───────────────────────────────────────────────────────────

describe('getProfileStatistics', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  async function importFresh() {
    const mod = await import('./get-profile-statistics');

    return mod.getProfileStatistics;
  }

  it('should return null when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const getProfileStatistics = await importFresh();
    const result = await getProfileStatistics();

    expect(result).toBeNull();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should call RPC with correct user id', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockRpc.mockResolvedValue({ data: validPayload, error: null });

    const getProfileStatistics = await importFresh();
    await getProfileStatistics();

    expect(mockRpc).toHaveBeenCalledWith('get_profile_statistics', { p_user_id: 'user-1' });
  });

  it('should return parsed data on valid RPC response', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockRpc.mockResolvedValue({ data: validPayload, error: null });

    const getProfileStatistics = await importFresh();
    const result = await getProfileStatistics();

    expect(result).toEqual(validPayload);
  });

  it('should return null on RPC error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const getProfileStatistics = await importFresh();
    const result = await getProfileStatistics();

    expect(result).toBeNull();
  });

  it('should return null when RPC returns null data', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockRpc.mockResolvedValue({ data: null, error: null });

    const getProfileStatistics = await importFresh();
    const result = await getProfileStatistics();

    expect(result).toBeNull();
  });

  it('should return null when response fails schema validation', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockRpc.mockResolvedValue({
      data: { totalSurveys: 'not-a-number' },
      error: null,
    });

    const getProfileStatistics = await importFresh();
    const result = await getProfileStatistics();

    expect(result).toBeNull();
  });
});
