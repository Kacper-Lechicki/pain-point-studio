// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Supabase server client
const mockSignOut = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      signOut: mockSignOut,
    },
  }),
}));

// Mock env (required by server client module)
vi.mock('@/lib/common/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

describe('Auth Actions – Sign Out', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Successful sign-out
  it('should call supabase.auth.signOut and return success', async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const { signOut } = await import('./sign-out');
    const result = await signOut();

    expect(mockSignOut).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  // Sign-out with error
  it('should return error when sign-out fails', async () => {
    mockSignOut.mockResolvedValue({ error: { message: 'Sign out failed' } });

    const { signOut } = await import('./sign-out');
    const result = await signOut();

    expect(mockSignOut).toHaveBeenCalled();
    expect(result).toEqual({ error: 'Sign out failed' });
  });
});
