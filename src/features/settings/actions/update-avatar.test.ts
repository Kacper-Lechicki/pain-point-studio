// @vitest-environment node
/** Tests for the updateAvatarUrl server action that persists the avatar URL to profile and user metadata. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppUser } from '@/lib/providers/types';

// Mock env
vi.mock('@/lib/common/env', () => ({
  env: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_APP_URL: 'https://example.com',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

// Mock rate limit
vi.mock('@/lib/common/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ limited: false }),
}));

// ── Provider mocks ──────────────────────────────────────────────────
const mockUpdateUser = vi.fn();
const mockGetUser = vi.fn();
const mockProfilesUpdate = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/supabase/providers/auth.server', () => ({
  createServerAuthProvider: vi.fn().mockReturnValue({
    getUser: mockGetUser,
    updateUser: mockUpdateUser,
  }),
}));

vi.mock('@/lib/supabase/providers/database', () => ({
  createSupabaseDatabaseClient: vi.fn().mockReturnValue({
    profiles: { update: mockProfilesUpdate },
    rpc: vi.fn(),
  }),
}));

vi.mock('@/lib/supabase/providers/storage.server', () => ({
  createServerStorageProvider: vi.fn().mockReturnValue({}),
}));

const defaultUser: AppUser = {
  id: 'user-123',
  email: 'user@example.com',
  identities: [],
  userMetadata: {},
  createdAt: new Date().toISOString(),
};

describe('Settings Actions – Update Avatar URL', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: defaultUser },
      error: null,
    });

    // Default: DB profile update succeeds
    mockProfilesUpdate.mockResolvedValue({ error: null });

    // Default: metadata update succeeds
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  it('should return success when avatar URL is updated', async () => {
    const { updateAvatarUrl } = await import('./update-avatar');
    const result = await updateAvatarUrl({
      avatarUrl: 'https://lh3.googleusercontent.com/a/avatar.png',
    });

    expect(result).toEqual({ success: true });
    expect(mockProfilesUpdate).toHaveBeenCalledWith('user-123', {
      avatar_url: 'https://lh3.googleusercontent.com/a/avatar.png',
    });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      data: { avatar_url: 'https://lh3.googleusercontent.com/a/avatar.png' },
    });
  });

  it('should return success when avatar is removed (empty URL)', async () => {
    const { updateAvatarUrl } = await import('./update-avatar');
    const result = await updateAvatarUrl({ avatarUrl: '' });

    expect(result).toEqual({ success: true });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      data: { avatar_url: '' },
    });
  });

  it('should return error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { updateAvatarUrl } = await import('./update-avatar');
    const result = await updateAvatarUrl({
      avatarUrl: 'https://lh3.googleusercontent.com/a/avatar.png',
    });

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
    expect(mockProfilesUpdate).not.toHaveBeenCalled();
  });

  it('should return error when profile DB update fails', async () => {
    mockProfilesUpdate.mockResolvedValue({ error: { message: 'Database error' } });

    const { updateAvatarUrl } = await import('./update-avatar');
    const result = await updateAvatarUrl({
      avatarUrl: 'https://lh3.googleusercontent.com/a/avatar.png',
    });

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('should return error when metadata update fails', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Metadata error' } });

    const { updateAvatarUrl } = await import('./update-avatar');
    const result = await updateAvatarUrl({
      avatarUrl: 'https://lh3.googleusercontent.com/a/avatar.png',
    });

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  it('should return error when avatar URL is not a valid URL', async () => {
    const { updateAvatarUrl } = await import('./update-avatar');
    const result = await updateAvatarUrl({ avatarUrl: 'not-a-url' });

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('should return rate limit error when rate limited', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const { updateAvatarUrl } = await import('./update-avatar');
    const result = await updateAvatarUrl({
      avatarUrl: 'https://lh3.googleusercontent.com/a/avatar.png',
    });

    expect(result.error).toBeDefined();
    expect(mockGetUser).not.toHaveBeenCalled();
  });
});
