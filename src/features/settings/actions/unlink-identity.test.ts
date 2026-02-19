// @vitest-environment node
/** Tests for the unlinkIdentity server action that disconnects an OAuth provider from the user account. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppIdentity, AppUser } from '@/lib/providers/types';

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

// ── Provider mocks ──────────────────────────────────────────────────
const mockUnlinkIdentity = vi.fn();
const mockGetUser = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/supabase/providers/auth.server', () => ({
  createServerAuthProvider: vi.fn().mockReturnValue({
    getUser: mockGetUser,
    updateUser: vi.fn(),
    unlinkIdentity: mockUnlinkIdentity,
  }),
}));

vi.mock('@/lib/supabase/providers/database', () => ({
  createSupabaseDatabaseClient: vi.fn().mockReturnValue({
    rpc: mockRpc,
    profiles: { update: vi.fn(), findById: vi.fn() },
  }),
}));

vi.mock('@/lib/supabase/providers/storage.server', () => ({
  createServerStorageProvider: vi.fn().mockReturnValue({}),
}));

const googleIdentity: AppIdentity = {
  identityId: 'google-identity-123',
  provider: 'google',
  email: 'user@example.com',
  identityData: { email: 'user@example.com' },
};

const githubIdentity: AppIdentity = {
  identityId: 'github-identity-456',
  provider: 'github',
  email: 'user@example.com',
  identityData: { email: 'user@example.com' },
};

const defaultUser: AppUser = {
  id: 'user-123',
  email: 'user@example.com',
  identities: [googleIdentity, githubIdentity],
  userMetadata: {},
  createdAt: new Date().toISOString(),
};

describe('Settings Actions – Unlink Identity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: defaultUser },
      error: null,
    });
    mockUnlinkIdentity.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({ data: false });
  });

  it('should successfully unlink when user has 2+ OAuth providers', async () => {
    const { unlinkIdentity } = await import('./unlink-identity');

    const result = await unlinkIdentity({
      identityId: 'google-identity-123',
      provider: 'google',
    });

    expect(result).toEqual({ success: true });
    expect(mockUnlinkIdentity).toHaveBeenCalledWith(googleIdentity);
  });

  it('should successfully unlink when user has 1 OAuth + password', async () => {
    const singleOAuthUser: AppUser = {
      ...defaultUser,
      identities: [googleIdentity],
    };

    mockGetUser.mockResolvedValue({
      data: { user: singleOAuthUser },
      error: null,
    });
    mockRpc.mockResolvedValue({ data: true });

    const { unlinkIdentity } = await import('./unlink-identity');

    const result = await unlinkIdentity({
      identityId: 'google-identity-123',
      provider: 'google',
    });

    expect(result).toEqual({ success: true });
    expect(mockRpc).toHaveBeenCalledWith('has_password');
    expect(mockUnlinkIdentity).toHaveBeenCalledWith(googleIdentity);
  });

  it('should reject when user has only 1 OAuth and no password', async () => {
    const singleOAuthUser: AppUser = {
      ...defaultUser,
      identities: [googleIdentity],
    };

    mockGetUser.mockResolvedValue({
      data: { user: singleOAuthUser },
      error: null,
    });
    mockRpc.mockResolvedValue({ data: false });

    const { unlinkIdentity } = await import('./unlink-identity');

    const result = await unlinkIdentity({
      identityId: 'google-identity-123',
      provider: 'google',
    });

    expect(result.error).toBe('settings.connectedAccounts.errors.cannotUnlinkLast');
    expect(mockUnlinkIdentity).not.toHaveBeenCalled();
  });

  it('should reject when identity is not found', async () => {
    const { unlinkIdentity } = await import('./unlink-identity');

    const result = await unlinkIdentity({
      identityId: 'nonexistent-id',
      provider: 'google',
    });

    expect(result.error).toBe('settings.connectedAccounts.errors.identityNotFound');
    expect(mockUnlinkIdentity).not.toHaveBeenCalled();
  });

  it('should return error when Supabase rejects the unlink', async () => {
    mockUnlinkIdentity.mockResolvedValue({
      error: { message: 'Unlink failed' },
    });

    const { unlinkIdentity } = await import('./unlink-identity');

    const result = await unlinkIdentity({
      identityId: 'google-identity-123',
      provider: 'google',
    });

    expect(result.error).toBe('settings.connectedAccounts.errors.unlinkFailed');
  });

  it('should return rate limit error when rate limited', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const { unlinkIdentity } = await import('./unlink-identity');

    const result = await unlinkIdentity({
      identityId: 'google-identity-123',
      provider: 'google',
    });

    expect(result.error).toBeDefined();
    expect(mockUnlinkIdentity).not.toHaveBeenCalled();
  });
});
