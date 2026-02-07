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

// Mock rate limiter — allow all by default
vi.mock('@/lib/common/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ limited: false }),
}));

// Mock Supabase server client
const mockUpdateUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      updateUser: mockUpdateUser,
    },
  }),
}));

const validPasswords = {
  password: 'NewSecurePass1!',
  confirmPassword: 'NewSecurePass1!',
};

describe('Settings Actions – Change Password', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: password update succeeds
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  it('should return success when password is changed', async () => {
    const { changePassword } = await import('./update-password');
    const result = await changePassword(validPasswords);

    expect(result).toEqual({ success: true });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: validPasswords.password,
    });
  });

  it('should not call Supabase when passwords are too weak', async () => {
    const { changePassword } = await import('./update-password');

    const result = await changePassword({
      password: 'weak',
      confirmPassword: 'weak',
    });

    expect(result.error).toBeDefined();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('should not call Supabase when passwords do not match', async () => {
    const { changePassword } = await import('./update-password');

    const result = await changePassword({
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
    const result = await changePassword(validPasswords);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  it('should return rate limit error when rate limited', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const { changePassword } = await import('./update-password');
    const result = await changePassword(validPasswords);

    expect(result.error).toBeDefined();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});
