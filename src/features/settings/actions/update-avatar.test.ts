// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

// Mock Supabase server client
const mockGetUser = vi.fn();
const mockUpdateUser = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: mockGetUser,
      updateUser: mockUpdateUser,
    },
    from: vi.fn().mockReturnValue({
      update: mockUpdate,
    }),
  }),
}));

describe('Settings Actions – Update Avatar URL', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    // Default: DB update succeeds
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });

    // Default: metadata update succeeds
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  // Valid URL: profile and metadata updated; returns success.
  it('should return success when avatar URL is updated', async () => {
    const { updateAvatarUrl } = await import('./update-avatar');
    const result = await updateAvatarUrl({ avatarUrl: 'https://storage.example.com/avatar.png' });

    expect(result).toEqual({ success: true });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      data: { avatar_url: 'https://storage.example.com/avatar.png' },
    });
  });

  // Empty URL clears avatar; updateUser called with empty string; success.
  it('should return success when avatar is removed (empty URL)', async () => {
    const { updateAvatarUrl } = await import('./update-avatar');
    const result = await updateAvatarUrl({ avatarUrl: '' });

    expect(result).toEqual({ success: true });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      data: { avatar_url: '' },
    });
  });

  // When getUser returns null, action returns error and does not update.
  it('should return error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { updateAvatarUrl } = await import('./update-avatar');
    const result = await updateAvatarUrl({ avatarUrl: 'https://storage.example.com/avatar.png' });

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  // Profile .update() failure returns error and does not call metadata update.
  it('should return error when profile DB update fails', async () => {
    mockEq.mockResolvedValue({ error: { message: 'Database error' } });

    const { updateAvatarUrl } = await import('./update-avatar');
    const result = await updateAvatarUrl({ avatarUrl: 'https://storage.example.com/avatar.png' });

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  // When updateUser (metadata) returns error, action returns error result.
  it('should return error when metadata update fails', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Metadata error' } });

    const { updateAvatarUrl } = await import('./update-avatar');
    const result = await updateAvatarUrl({ avatarUrl: 'https://storage.example.com/avatar.png' });

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  // Invalid URL fails validation; Supabase is not called.
  it('should return error when avatar URL is not a valid URL', async () => {
    const { updateAvatarUrl } = await import('./update-avatar');
    const result = await updateAvatarUrl({ avatarUrl: 'not-a-url' });

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  // When rate limited, action returns error and does not call Supabase.
  it('should return rate limit error when rate limited', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const { updateAvatarUrl } = await import('./update-avatar');
    const result = await updateAvatarUrl({ avatarUrl: 'https://storage.example.com/avatar.png' });

    expect(result.error).toBeDefined();
    expect(mockGetUser).not.toHaveBeenCalled();
  });
});
