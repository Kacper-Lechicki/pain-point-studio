// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/common/env', () => ({
  env: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_APP_URL: 'https://example.com',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

const mockGetUser = vi.fn();
const mockProfileSingle = vi.fn();
const mockRpc = vi.fn();

const mockUser = {
  id: 'user-123',
  email: 'john@example.com',
  user_metadata: {},
  identities: [],
  created_at: '2025-01-01T00:00:00Z',
};

const mockProfile = {
  id: 'user-123',
  full_name: 'John Doe',
  role: 'developer',
  avatar_url: 'https://example.com/avatar.png',
  pinned_project_id: 'project-456',
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockProfileSingle,
            }),
          }),
        };
      }

      return {};
    }),
  }),
}));

describe('getProfileSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockProfileSingle.mockResolvedValue({ data: mockProfile });
  });

  it('should return null when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getProfileSummary } = await import('./get-profile-summary');
    const result = await getProfileSummary();

    expect(result).toBeNull();
  });

  it('should return summary with only layout-required fields', async () => {
    const { getProfileSummary } = await import('./get-profile-summary');
    const result = await getProfileSummary();

    expect(result).toEqual({
      id: 'user-123',
      fullName: 'John Doe',
      role: 'developer',
      avatarUrl: 'https://example.com/avatar.png',
      pinnedProjectId: 'project-456',
    });
  });

  it('should not call any RPCs', async () => {
    const { getProfileSummary } = await import('./get-profile-summary');
    await getProfileSummary();

    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should handle null profile with empty defaults', async () => {
    mockProfileSingle.mockResolvedValue({ data: null });

    const { getProfileSummary } = await import('./get-profile-summary');
    const result = await getProfileSummary();

    expect(result).toEqual({
      id: 'user-123',
      fullName: '',
      role: '',
      avatarUrl: '',
      pinnedProjectId: null,
    });
  });

  it('should use avatar_url from user_metadata as fallback', async () => {
    mockProfileSingle.mockResolvedValue({
      data: { ...mockProfile, avatar_url: null },
    });

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          ...mockUser,
          user_metadata: { avatar_url: 'https://google.com/photo.jpg' },
        },
      },
    });

    const { getProfileSummary } = await import('./get-profile-summary');
    const result = await getProfileSummary();

    expect(result!.avatarUrl).toBe('https://google.com/photo.jpg');
  });
});
