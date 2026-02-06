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

  // Successful registration flow
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

  // Supabase error handling during registration
  it('should return error on Supabase failure', async () => {
    mockSignUp.mockResolvedValue({
      error: { message: 'User already registered' },
    });

    const { signUpWithEmail } = await import('./sign-up');

    const result = await signUpWithEmail({
      email: 'existing@example.com',
      password: 'SecurePass1!',
    });

    expect(result).toEqual({ error: 'User already registered' });
  });

  // Input validation failure
  it('should return error on invalid form data', async () => {
    const { signUpWithEmail } = await import('./sign-up');

    const result = await signUpWithEmail({
      email: 'invalid',
      password: 'sh',
    });

    expect(result).toEqual({ error: 'Invalid data' });
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});
