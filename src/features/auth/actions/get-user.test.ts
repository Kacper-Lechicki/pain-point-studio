// @vitest-environment node
/** getAuthUser action: authenticated user retrieval from Supabase. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock env (required by server client module if it interacts with env)
vi.mock('@/lib/common/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'https://example.com',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

// Mock Supabase server client
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

describe('Auth Actions – Get User', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user when authenticated', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });

    const { getAuthUser } = await import('./get-user');
    const user = await getAuthUser();

    expect(user).toEqual(mockUser);
    expect(mockGetUser).toHaveBeenCalled();
  });

  it('should return null when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getAuthUser } = await import('./get-user');
    const user = await getAuthUser();

    expect(user).toBeNull();
  });
});
