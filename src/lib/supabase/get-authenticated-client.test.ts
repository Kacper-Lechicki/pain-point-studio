// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUser = { id: 'user-1', email: 'test@example.com' };
const mockGetUser = vi.fn();
const mockSupabase = { auth: { getUser: mockGetUser } };

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

describe('getAuthenticatedClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should return user and supabase client when authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    const { getAuthenticatedClient } = await import('./get-authenticated-client');

    const result = await getAuthenticatedClient();

    expect(result.user).toEqual(mockUser);
    expect(result.supabase).toBe(mockSupabase);
  });

  it('should return null user when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { getAuthenticatedClient } = await import('./get-authenticated-client');

    const result = await getAuthenticatedClient();

    expect(result.user).toBeNull();
    expect(result.supabase).toBe(mockSupabase);
  });
});
