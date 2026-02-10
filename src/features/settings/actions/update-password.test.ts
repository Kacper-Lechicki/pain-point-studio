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

const mockUpdateUser = vi.fn();
const mockGetUser = vi.fn();
const mockSignInWithPassword = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      updateUser: mockUpdateUser,
      getUser: mockGetUser,
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

const validData = {
  currentPassword: 'OldPass1!',
  password: 'NewSecurePass1!',
  confirmPassword: 'NewSecurePass1!',
};

describe('Settings Actions – Update Password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { email: 'user@example.com' } } });
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  it('should return success when password is changed', async () => {
    const { updatePassword } = await import('./update-password');
    const result = await updatePassword(validData);

    expect(result).toEqual({ success: true });
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: validData.currentPassword,
    });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: validData.password,
    });
  });

  it('should not call Supabase when passwords are too weak', async () => {
    const { updatePassword } = await import('./update-password');

    const result = await updatePassword({
      currentPassword: 'OldPass1!',
      password: 'weak',
      confirmPassword: 'weak',
    });

    expect(result.error).toBeDefined();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('should not call Supabase when passwords do not match', async () => {
    const { updatePassword } = await import('./update-password');

    const result = await updatePassword({
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

    const { updatePassword } = await import('./update-password');
    const result = await updatePassword(validData);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  it('should return rate limit error when rate limited', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const { updatePassword } = await import('./update-password');
    const result = await updatePassword(validData);

    expect(result.error).toBeDefined();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('should reject when current password is incorrect', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });

    const { updatePassword } = await import('./update-password');
    const result = await updatePassword({
      currentPassword: 'WrongPass1!',
      password: 'NewSecurePass1!',
      confirmPassword: 'NewSecurePass1!',
    });

    expect(result.error).toBe('settings.errors.currentPasswordIncorrect');
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('should return unexpected error when user has no email', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { email: null } } });

    const { updatePassword } = await import('./update-password');
    const result = await updatePassword(validData);

    expect(result.error).toBe('settings.errors.unexpected');
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('should return unexpected error when getUser returns no user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { updatePassword } = await import('./update-password');
    const result = await updatePassword(validData);

    expect(result.error).toBe('settings.errors.unexpected');
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});
