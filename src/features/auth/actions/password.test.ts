// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
}));

// Mock env
vi.mock('@/lib/common/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'https://example.com',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

// Mock Supabase server client
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
    },
  }),
}));

describe('Auth Actions – Password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resetPassword', () => {
    // Successful password reset flow
    it('should return success on valid email', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      const { resetPassword } = await import('./password');
      const result = await resetPassword({ email: 'test@example.com' });

      expect(result).toEqual({ success: true });

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: 'https://example.com/en/auth/callback?next=/en/update-password',
      });
    });

    // Supabase error handling during reset
    it('should return error on Supabase failure', async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        error: { message: 'User not found' },
      });

      const { resetPassword } = await import('./password');
      const result = await resetPassword({ email: 'nonexistent@example.com' });

      expect(result).toEqual({ error: 'User not found' });
    });

    // Email validation failure
    it('should return error on invalid email', async () => {
      const { resetPassword } = await import('./password');
      const result = await resetPassword({ email: 'bad-email' });

      expect(result).toEqual({ error: 'Invalid email' });
      expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
    });
  });

  describe('updatePassword', () => {
    // Successful password update flow
    it('should return success on valid matching passwords', async () => {
      mockUpdateUser.mockResolvedValue({ error: null });

      const { updatePassword } = await import('./password');

      const result = await updatePassword({
        password: 'newpassword1',
        confirmPassword: 'newpassword1',
      });

      expect(result).toEqual({ success: true });

      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: 'newpassword1',
      });
    });

    // Supabase error handling during update
    it('should return error on Supabase failure', async () => {
      mockUpdateUser.mockResolvedValue({
        error: { message: 'Same password' },
      });

      const { updatePassword } = await import('./password');

      const result = await updatePassword({
        password: 'samepassword',
        confirmPassword: 'samepassword',
      });

      expect(result).toEqual({ error: 'Same password' });
    });

    // Password mismatch validation
    it('should return error on non-matching passwords', async () => {
      const { updatePassword } = await import('./password');

      const result = await updatePassword({
        password: 'password123',
        confirmPassword: 'different123',
      });

      expect(result).toEqual({ error: 'Invalid passwords' });
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    // Password complexity/length validation
    it('should return error on short passwords', async () => {
      const { updatePassword } = await import('./password');

      const result = await updatePassword({
        password: 'short',
        confirmPassword: 'short',
      });

      expect(result).toEqual({ error: 'Invalid passwords' });
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });
});
