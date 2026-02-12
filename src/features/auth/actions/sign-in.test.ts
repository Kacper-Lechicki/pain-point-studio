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
    // Valid email/password call signInWithPassword and return success.
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

    // When Supabase returns error (e.g. invalid credentials), action returns error.
    it('should return an error when Supabase rejects credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({
        error: { message: 'Invalid login credentials' },
      });

      const { signInWithEmail } = await import('./sign-in');

      const result = await signInWithEmail({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.error).toBeDefined();
      expect(result).not.toHaveProperty('success');
    });

    // Invalid email/password fail validation; Supabase is not called.
    it('should not call Supabase when form data is invalid', async () => {
      const { signInWithEmail } = await import('./sign-in');

      const result = await signInWithEmail({
        email: 'not-an-email',
        password: 'pw',
      });

      expect(result.error).toBeDefined();
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    // When rate limited, action returns error and does not call Supabase.
    it('should return rate limit error when rate limited', async () => {
      const { rateLimit } = await import('@/lib/common/rate-limit');

      vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

      const { signInWithEmail } = await import('./sign-in');

      const result = await signInWithEmail({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.error).toBeDefined();
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });
  });

  describe('signInWithOAuth', () => {
    // OAuth returns URL; action calls redirect with that URL.
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

    // When signInWithOAuth returns error, action returns error result.
    it('should return an error on OAuth failure', async () => {
      mockSignInWithOAuth.mockResolvedValue({
        data: {},
        error: { message: 'OAuth error' },
      });

      const { signInWithOAuth } = await import('./sign-in');
      const result = await signInWithOAuth('github');

      expect(result.error).toBeDefined();
    });

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

    it('should return an error when OAuth returns no redirect URL', async () => {
      mockSignInWithOAuth.mockResolvedValue({
        data: { url: null },
        error: null,
      });

      const { signInWithOAuth } = await import('./sign-in');
      const result = await signInWithOAuth('google');

      expect(result.error).toBeDefined();
    });
  });
});
