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

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => `translated:${key}`),
}));

// Mock Supabase server client
const mockGetUser = vi.fn();
const mockProfileSingle = vi.fn();
const mockRpc = vi.fn();

const mockProfile = {
  id: 'user-123',
  full_name: 'John Doe',
  role: 'solo-developer',
  bio: 'A test bio',
  avatar_url: 'https://example.com/avatar.png',
  social_links: [{ label: 'github', url: 'https://github.com/johndoe' }],
};

const mockUser = {
  id: 'user-123',
  email: 'john@example.com',
  user_metadata: {},
  identities: [
    { provider: 'email', identity_data: { email: 'john@example.com' }, identity_id: 'email-id-1' },
    { provider: 'google', identity_data: { email: 'john@gmail.com' }, identity_id: 'google-id-1' },
  ],
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: mockGetUser,
    },
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

describe('Settings Actions – Get Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });

    // Default: profile found
    mockProfileSingle.mockResolvedValue({ data: mockProfile });

    // Default: has password, no pending email change
    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'has_password') {
        return Promise.resolve({ data: true });
      }

      if (fn === 'get_email_change_status') {
        return Promise.resolve({ data: [] });
      }

      return Promise.resolve({ data: null });
    });
  });

  // When getUser returns null, getProfile returns null.
  it('should return null when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getProfile } = await import('./get-profile');
    const result = await getProfile();

    expect(result).toBeNull();
  });

  // Profile, roles, social links, identities merged into ProfileData with expected shape.
  it('should return correct ProfileData with all fields', async () => {
    const { getProfile } = await import('./get-profile');
    const result = await getProfile();

    expect(result).not.toBeNull();
    expect(result!.id).toBe('user-123');
    expect(result!.email).toBe('john@example.com');
    expect(result!.fullName).toBe('John Doe');
    expect(result!.role).toBe('solo-developer');
    expect(result!.bio).toBe('A test bio');
    expect(result!.avatarUrl).toBe('https://example.com/avatar.png');
    expect(result!.hasPassword).toBe(true);
    expect(result!.pendingEmail).toBeNull();
    expect(result!.emailChangeConfirmStatus).toBe(0);
    expect(result!.socialLinks).toEqual([{ label: 'github', url: 'https://github.com/johndoe' }]);
    expect(result!.identities).toEqual([
      { provider: 'email', email: 'john@example.com', identityId: 'email-id-1' },
      { provider: 'google', email: 'john@gmail.com', identityId: 'google-id-1' },
    ]);
  });

  // roleOptions and socialLinkOptions use t() for labels from static config.
  it('should map roleOptions and socialLinkOptions with translated labels', async () => {
    const { getProfile } = await import('./get-profile');
    const result = await getProfile();

    expect(result!.roleOptions).toEqual([
      { value: 'solo-developer', label: 'translated:settings.roles.soloDeveloper' },
      { value: 'product-manager', label: 'translated:settings.roles.productManager' },
      { value: 'designer', label: 'translated:settings.roles.designer' },
      { value: 'founder', label: 'translated:settings.roles.founder' },
      { value: 'student', label: 'translated:settings.roles.student' },
      { value: 'other', label: 'translated:settings.roles.other' },
    ]);
    expect(result!.socialLinkOptions).toEqual([
      { value: 'website', label: 'translated:settings.profile.socialLinks.labels.website' },
      { value: 'github', label: 'translated:settings.profile.socialLinks.labels.github' },
      { value: 'twitter', label: 'translated:settings.profile.socialLinks.labels.twitter' },
      { value: 'linkedin', label: 'translated:settings.profile.socialLinks.labels.linkedin' },
      { value: 'other', label: 'translated:settings.profile.socialLinks.labels.other' },
    ]);
  });

  // Null profile row yields empty strings and empty arrays for optional fields.
  it('should handle null profile with empty defaults', async () => {
    mockProfileSingle.mockResolvedValue({ data: null });

    const { getProfile } = await import('./get-profile');
    const result = await getProfile();

    expect(result).not.toBeNull();
    expect(result!.fullName).toBe('');
    expect(result!.role).toBe('');
    expect(result!.bio).toBe('');
    expect(result!.avatarUrl).toBe('');
    expect(result!.socialLinks).toEqual([]);
  });

  // Non-array social_links (e.g. malformed) yields empty socialLinks array.
  it('should fallback to empty array when social_links is not an array', async () => {
    mockProfileSingle.mockResolvedValue({
      data: { ...mockProfile, social_links: 'not-an-array' },
    });

    const { getProfile } = await import('./get-profile');
    const result = await getProfile();

    expect(result!.socialLinks).toEqual([]);
  });

  // has_password RPC false sets hasPassword to false on result.
  it('should set hasPassword to false when RPC returns false', async () => {
    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'has_password') {
        return Promise.resolve({ data: false });
      }

      return Promise.resolve({ data: [] });
    });

    const { getProfile } = await import('./get-profile');
    const result = await getProfile();

    expect(result!.hasPassword).toBe(false);
  });

  // get_email_change_status RPC populates pendingEmail and emailChangeConfirmStatus.
  it('should return pending email change status when change is in progress', async () => {
    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'has_password') {
        return Promise.resolve({ data: true });
      }

      if (fn === 'get_email_change_status') {
        return Promise.resolve({
          data: [{ new_email: 'new@example.com', confirm_status: 1 }],
        });
      }

      return Promise.resolve({ data: null });
    });

    const { getProfile } = await import('./get-profile');
    const result = await getProfile();

    expect(result!.pendingEmail).toBe('new@example.com');
    expect(result!.emailChangeConfirmStatus).toBe(1);
  });

  // When profile avatar_url is null, user_metadata.avatar_url is used.
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

    const { getProfile } = await import('./get-profile');
    const result = await getProfile();

    expect(result!.avatarUrl).toBe('https://google.com/photo.jpg');
  });
});
