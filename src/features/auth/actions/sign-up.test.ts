// @vitest-environment node
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

// Mock Supabase server client
const mockSignUp = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      signUp: mockSignUp,
    },
  }),
}));

describe('Auth Actions – Sign Up', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return success on valid registration', async () => {
    mockSignUp.mockResolvedValue({ error: null });

    const { signUpWithEmail } = await import('./sign-up');

    const result = await signUpWithEmail({
      email: 'new@example.com',
      password: 'SecurePass1!',
    });

    expect(result).toEqual({ success: true });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'SecurePass1!',
      options: {
        emailRedirectTo: 'https://example.com/en/auth/callback',
      },
    });
  });

  it('should return an error when Supabase rejects registration', async () => {
    mockSignUp.mockResolvedValue({
      error: { message: 'User already registered' },
    });

    const { signUpWithEmail } = await import('./sign-up');

    const result = await signUpWithEmail({
      email: 'existing@example.com',
      password: 'SecurePass1!',
    });

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  it('should not call Supabase when form data is invalid', async () => {
    const { signUpWithEmail } = await import('./sign-up');

    const result = await signUpWithEmail({
      email: 'invalid',
      password: 'sh',
    });

    expect(result.error).toBeDefined();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('should return rate limit error when rate limited', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const { signUpWithEmail } = await import('./sign-up');

    const result = await signUpWithEmail({
      email: 'new@example.com',
      password: 'SecurePass1!',
    });

    expect(result.error).toBeDefined();
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});
