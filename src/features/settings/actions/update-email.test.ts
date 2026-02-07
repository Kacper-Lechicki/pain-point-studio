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

describe('Settings Actions – Update Email', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: email update succeeds
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  it('should return success when email is updated', async () => {
    const { updateEmail } = await import('./update-email');
    const result = await updateEmail({ email: 'new@example.com' });

    expect(result).toEqual({ success: true });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      email: 'new@example.com',
    });
  });

  it('should not call Supabase when email is invalid', async () => {
    const { updateEmail } = await import('./update-email');
    const result = await updateEmail({ email: 'not-an-email' });

    expect(result.error).toBeDefined();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('should return error when Supabase rejects the update', async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: 'Email rate limit exceeded' },
    });

    const { updateEmail } = await import('./update-email');
    const result = await updateEmail({ email: 'new@example.com' });

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  it('should return rate limit error when rate limited', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const { updateEmail } = await import('./update-email');
    const result = await updateEmail({ email: 'new@example.com' });

    expect(result.error).toBeDefined();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});
