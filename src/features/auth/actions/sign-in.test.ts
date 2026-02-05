// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock redirect
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

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
const mockSignInWithPassword = vi.fn();
const mockSignInWithOAuth = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}));

describe('Auth Actions – Sign In', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signInWithEmail', () => {
    // Successful sign-in with email
    it('should return success on valid credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });

      const { signInWithEmail } = await import('./sign-in');

      const result = await signInWithEmail({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({ success: true });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Invalid credentials error handling
    it('should return error on invalid credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({
        error: { message: 'Invalid login credentials' },
      });

      const { signInWithEmail } = await import('./sign-in');

      const result = await signInWithEmail({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result).toEqual({ error: 'Invalid login credentials' });
    });

    // Zod validation failure for email/password
    it('should return error on invalid form data', async () => {
      const { signInWithEmail } = await import('./sign-in');

      const result = await signInWithEmail({
        email: 'not-an-email',
        password: 'pw',
      });

      expect(result).toEqual({ error: 'Invalid data' });
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });
  });

  describe('signInWithOAuth', () => {
    // Successful OAuth provider redirection
    it('should redirect on successful OAuth', async () => {
      const { redirect } = await import('next/navigation');

      mockSignInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth' },
        error: null,
      });

      const { signInWithOAuth } = await import('./sign-in');
      await signInWithOAuth('google');

      expect(redirect).toHaveBeenCalledWith('https://accounts.google.com/oauth');
    });

    // OAuth failure error handling
    it('should return error on OAuth failure', async () => {
      mockSignInWithOAuth.mockResolvedValue({
        data: {},
        error: { message: 'OAuth error' },
      });

      const { signInWithOAuth } = await import('./sign-in');
      const result = await signInWithOAuth('github');

      expect(result).toEqual({ error: 'OAuth error' });
    });

    // OAuth callback URL construction with locale
    it('should construct correct redirect URL with locale', async () => {
      mockSignInWithOAuth.mockResolvedValue({
        data: { url: 'https://github.com/oauth' },
        error: null,
      });

      const { signInWithOAuth } = await import('./sign-in');

      try {
        await signInWithOAuth('github');
      } catch {}

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: 'https://example.com/en/auth/callback',
        },
      });
    });
  });
});
