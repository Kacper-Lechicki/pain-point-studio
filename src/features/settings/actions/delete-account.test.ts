// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock env
vi.mock('@/lib/common/env', () => ({
  env: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_APP_URL: 'https://example.com',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  },
}));

// Mock rate limiter — allow all by default
vi.mock('@/lib/common/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ limited: false }),
}));

// Mock Supabase server client
const mockGetUser = vi.fn();
const mockSignOut = vi.fn();
const mockStorageList = vi.fn();
const mockStorageRemove = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: mockGetUser,
      signOut: mockSignOut,
    },
    storage: {
      from: vi.fn().mockReturnValue({
        list: mockStorageList,
        remove: mockStorageRemove,
      }),
    },
  }),
}));

// Mock admin client
const mockAdminDeleteUser = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    auth: {
      admin: {
        deleteUser: mockAdminDeleteUser,
      },
    },
  }),
}));

const validConfirmation = { confirmation: 'delete my account' };

describe('Settings Actions – Delete Account', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    // Default: no avatar files
    mockStorageList.mockResolvedValue({ data: [] });
    mockStorageRemove.mockResolvedValue({ error: null });

    // Default: admin delete succeeds
    mockAdminDeleteUser.mockResolvedValue({ error: null });

    // Default: sign out succeeds
    mockSignOut.mockResolvedValue({ error: null });
  });

  it('should return success when account is deleted', async () => {
    const { deleteAccount } = await import('./delete-account');
    const result = await deleteAccount(validConfirmation);

    expect(result).toEqual({ success: true });
    expect(mockAdminDeleteUser).toHaveBeenCalledWith('user-123');
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should clean up avatar files before deletion', async () => {
    mockStorageList.mockResolvedValue({
      data: [{ name: 'avatar.png' }, { name: 'old-avatar.jpg' }],
    });

    const { deleteAccount } = await import('./delete-account');

    await deleteAccount(validConfirmation);

    expect(mockStorageRemove).toHaveBeenCalledWith([
      'user-123/avatar.png',
      'user-123/old-avatar.jpg',
    ]);
  });

  it('should not clean up storage when no avatar files exist', async () => {
    mockStorageList.mockResolvedValue({ data: [] });

    const { deleteAccount } = await import('./delete-account');

    await deleteAccount(validConfirmation);

    expect(mockStorageRemove).not.toHaveBeenCalled();
  });

  it('should return error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { deleteAccount } = await import('./delete-account');
    const result = await deleteAccount(validConfirmation);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
    expect(mockAdminDeleteUser).not.toHaveBeenCalled();
  });

  it('should return error when admin delete fails', async () => {
    mockAdminDeleteUser.mockResolvedValue({
      error: { message: 'Admin delete failed' },
    });

    const { deleteAccount } = await import('./delete-account');
    const result = await deleteAccount(validConfirmation);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('should not call Supabase when form data is invalid', async () => {
    const { deleteAccount } = await import('./delete-account');

    // Pass a number instead of a string — should fail safeParse
    const result = await deleteAccount({ confirmation: 123 } as unknown as {
      confirmation: string;
    });

    expect(result.error).toBeDefined();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('should return rate limit error when rate limited', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const { deleteAccount } = await import('./delete-account');
    const result = await deleteAccount(validConfirmation);

    expect(result.error).toBeDefined();
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockAdminDeleteUser).not.toHaveBeenCalled();
  });
});
