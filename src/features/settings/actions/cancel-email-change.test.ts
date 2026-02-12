// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/common/env', () => ({
  env: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_APP_URL: 'https://example.com',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

vi.mock('@/lib/common/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ limited: false }),
}));

const mockGetUser = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: mockGetUser,
    },
    rpc: mockRpc,
  }),
}));

describe('Settings Actions – Cancel Email Change', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'user@example.com' } },
    });
    mockRpc.mockResolvedValue({ error: null });
  });

  // RPC cancel_email_change succeeds; action returns success.
  it('should return success when email change is cancelled', async () => {
    const { cancelEmailChange } = await import('./cancel-email-change');
    const result = await cancelEmailChange({});

    expect(result).toEqual({ success: true });
    expect(mockRpc).toHaveBeenCalledWith('cancel_email_change');
  });

  // When RPC returns error, action returns settings.errors.unexpected.
  it('should return error when RPC fails', async () => {
    mockRpc.mockResolvedValue({
      error: { message: 'RPC failed' },
    });

    const { cancelEmailChange } = await import('./cancel-email-change');
    const result = await cancelEmailChange({});

    expect(result.error).toBe('settings.errors.unexpected');
  });

  // When rate limited, action returns error and does not call RPC.
  it('should return rate limit error when rate limited', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const { cancelEmailChange } = await import('./cancel-email-change');
    const result = await cancelEmailChange({});

    expect(result.error).toBeDefined();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  // When getUser returns null, action returns error and does not call RPC.
  it('should return error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { cancelEmailChange } = await import('./cancel-email-change');
    const result = await cancelEmailChange({});

    expect(result.error).toBeDefined();
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
