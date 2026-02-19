// @vitest-environment node
/** Tests for the changePassword and setPassword server actions that manage password updates and initial password creation. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppUser } from '@/lib/providers/types';

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
const mockUpdateUser = vi.fn();
const mockGetUser = vi.fn();
const mockRpc = vi.fn();
const mockAdminUpdateUserById = vi.fn();

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
    rpc: mockRpc,
    profiles: { update: vi.fn(), findById: vi.fn() },
  }),
}));

vi.mock('@/lib/supabase/providers/storage.server', () => ({
  createServerStorageProvider: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/providers/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/providers/server')>();

  return {
    ...actual,
    createAuthAdmin: vi.fn().mockReturnValue({
      updateUserById: mockAdminUpdateUserById,
    }),
  };
});

const changeData = {
  currentPassword: 'OldPass1!',
  password: 'NewSecurePass1!',
  confirmPassword: 'NewSecurePass1!',
};

const setData = {
  password: 'NewSecurePass1!',
  confirmPassword: 'NewSecurePass1!',
};

const defaultUser: AppUser = {
  id: 'user-id-123',
  email: 'user@example.com',
  identities: [{ identityId: 'e-456', provider: 'email' }],
  userMetadata: {},
  createdAt: new Date().toISOString(),
};

describe('Settings Actions – changePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: defaultUser },
      error: null,
    });
    mockRpc.mockResolvedValue({ data: true });
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  it('should return success when password is changed', async () => {
    const { changePassword } = await import('./update-password');
    const result = await changePassword(changeData);

    expect(result).toEqual({ success: true });
    expect(mockRpc).toHaveBeenCalledWith('verify_password', {
      current_plain_password: changeData.currentPassword,
    });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: changeData.password,
    });
  });

  it('should not call Supabase when passwords are too weak', async () => {
    const { changePassword } = await import('./update-password');

    const result = await changePassword({
      currentPassword: 'OldPass1!',
      password: 'weak',
      confirmPassword: 'weak',
    });

    expect(result.error).toBeDefined();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('should not call Supabase when passwords do not match', async () => {
    const { changePassword } = await import('./update-password');

    const result = await changePassword({
      currentPassword: 'OldPass1!',
      password: 'NewSecurePass1!',
      confirmPassword: 'DifferentPass1!',
    });

    expect(result.error).toBeDefined();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('should return error when Supabase rejects the update', async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: 'Password update failed' },
    });

    const { changePassword } = await import('./update-password');
    const result = await changePassword(changeData);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  it('should return rate limit error when rate limited', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const { changePassword } = await import('./update-password');
    const result = await changePassword(changeData);

    expect(result.error).toBeDefined();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('should reject when current password is incorrect', async () => {
    mockRpc.mockResolvedValue({ data: false });

    const { changePassword } = await import('./update-password');
    const result = await changePassword({
      currentPassword: 'WrongPass1!',
      password: 'NewSecurePass1!',
      confirmPassword: 'NewSecurePass1!',
    });

    expect(result.error).toBe('settings.errors.currentPasswordIncorrect');
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('should return unexpected error when getUser returns no user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { changePassword } = await import('./update-password');
    const result = await changePassword(changeData);

    expect(result.error).toBe('settings.errors.unexpected');
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});

describe('Settings Actions – setPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const oauthOnlyUser: AppUser = {
      id: 'user-id-123',
      email: 'user@example.com',
      identities: [{ identityId: 'g-123', provider: 'google' }],
      userMetadata: {},
      createdAt: new Date().toISOString(),
    };

    mockGetUser.mockResolvedValue({
      data: { user: oauthOnlyUser },
      error: null,
    });
    mockRpc.mockResolvedValue({ data: false });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockAdminUpdateUserById.mockResolvedValue({ error: null });
  });

  it('should return success and create email identity for OAuth-only user', async () => {
    const { setPassword } = await import('./update-password');
    const result = await setPassword(setData);

    expect(result).toEqual({ success: true });
    expect(mockRpc).toHaveBeenCalledWith('has_password');
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: setData.password });
    expect(mockAdminUpdateUserById).toHaveBeenCalledWith('user-id-123', {
      email: 'user@example.com',
    });
    expect(mockRpc).not.toHaveBeenCalledWith('verify_password', expect.anything());
  });

  it('should not create email identity if one already exists', async () => {
    const userWithEmail: AppUser = {
      id: 'user-id-123',
      email: 'user@example.com',
      identities: [
        { identityId: 'g-123', provider: 'google' },
        { identityId: 'e-456', provider: 'email' },
      ],
      userMetadata: {},
      createdAt: new Date().toISOString(),
    };

    mockGetUser.mockResolvedValue({
      data: { user: userWithEmail },
      error: null,
    });

    const { setPassword } = await import('./update-password');
    const result = await setPassword(setData);

    expect(result).toEqual({ success: true });
    expect(mockAdminUpdateUserById).not.toHaveBeenCalled();
  });

  it('should reject when user already has a password', async () => {
    mockRpc.mockResolvedValue({ data: true });

    const { setPassword } = await import('./update-password');
    const result = await setPassword(setData);

    expect(result.error).toBe('settings.errors.unexpected');
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('should not call Supabase when passwords are too weak', async () => {
    const { setPassword } = await import('./update-password');

    const result = await setPassword({
      password: 'weak',
      confirmPassword: 'weak',
    });

    expect(result.error).toBeDefined();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('should not call Supabase when passwords do not match', async () => {
    const { setPassword } = await import('./update-password');

    const result = await setPassword({
      password: 'NewSecurePass1!',
      confirmPassword: 'DifferentPass1!',
    });

    expect(result.error).toBeDefined();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('should return error when Supabase rejects the update', async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: 'Password update failed' },
    });

    const { setPassword } = await import('./update-password');
    const result = await setPassword(setData);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  it('should return rate limit error when rate limited', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const { setPassword } = await import('./update-password');
    const result = await setPassword(setData);

    expect(result.error).toBeDefined();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});
