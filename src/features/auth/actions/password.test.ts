// @vitest-environment node
/** Password actions: forgot-password and update-password flows with validation and rate limiting. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
}));

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

// Mock Supabase server client (still needed by withPublicAction for the db client)
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({}),
}));

// Mock server auth provider
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock('@/lib/providers/server', () => ({
  createServerAuth: vi.fn().mockResolvedValue({
    resetPasswordForEmail: mockResetPasswordForEmail,
    updateUser: mockUpdateUser,
  }),
  mapAuthError: vi.fn((msg: string) => `mapped:${msg}`),
}));

describe('Auth Actions – Password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resetPassword', () => {
    it('should return success on valid email', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      const { resetPassword } = await import('./password');
      const result = await resetPassword({ email: 'test@example.com' });

      expect(result).toEqual({ success: true });

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: 'https://example.com/en/auth/callback?next=/en/update-password',
      });
    });

    it('should return an error when the auth provider fails', async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        error: { message: 'User not found' },
      });

      const { resetPassword } = await import('./password');
      const result = await resetPassword({ email: 'nonexistent@example.com' });

      expect(result.error).toBeDefined();
      expect(result).not.toHaveProperty('success');
    });

    it('should not call the auth provider when email is invalid', async () => {
      const { resetPassword } = await import('./password');
      const result = await resetPassword({ email: 'bad-email' });

      expect(result.error).toBeDefined();
      expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
    });

    it('should return rate limit error when rate limited', async () => {
      const { rateLimit } = await import('@/lib/common/rate-limit');

      vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

      const { resetPassword } = await import('./password');
      const result = await resetPassword({ email: 'test@example.com' });

      expect(result.error).toBeDefined();
      expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
    });
  });

  describe('updatePassword', () => {
    it('should return success on valid matching passwords', async () => {
      mockUpdateUser.mockResolvedValue({ error: null });

      const { updatePassword } = await import('./password');

      const result = await updatePassword({
        password: 'NewPassword1!',
        confirmPassword: 'NewPassword1!',
      });

      expect(result).toEqual({ success: true });

      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: 'NewPassword1!',
      });
    });

    it('should return an error when the auth provider rejects the update', async () => {
      mockUpdateUser.mockResolvedValue({
        error: { message: 'Same password' },
      });

      const { updatePassword } = await import('./password');

      const result = await updatePassword({
        password: 'SamePassword1!',
        confirmPassword: 'SamePassword1!',
      });

      expect(result.error).toBeDefined();
      expect(result).not.toHaveProperty('success');
    });

    it('should not call the auth provider when passwords do not match', async () => {
      const { updatePassword } = await import('./password');

      const result = await updatePassword({
        password: 'Password123!',
        confirmPassword: 'Different123!',
      });

      expect(result.error).toBeDefined();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('should not call the auth provider when password is too short', async () => {
      const { updatePassword } = await import('./password');

      const result = await updatePassword({
        password: 'short',
        confirmPassword: 'short',
      });

      expect(result.error).toBeDefined();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('should return rate limit error when rate limited', async () => {
      const { rateLimit } = await import('@/lib/common/rate-limit');

      vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

      const { updatePassword } = await import('./password');

      const result = await updatePassword({
        password: 'NewPassword1!',
        confirmPassword: 'NewPassword1!',
      });

      expect(result.error).toBeDefined();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });
});
