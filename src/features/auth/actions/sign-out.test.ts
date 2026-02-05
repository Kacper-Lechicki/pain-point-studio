// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock redirect
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

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

  // Successful sign-out and redirection
  it('should call supabase.auth.signOut and redirect to home', async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const { signOut } = await import('./sign-out');
    await signOut();

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith('/');
  });
});
