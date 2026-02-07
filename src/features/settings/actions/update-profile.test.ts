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
const mockGetUser = vi.fn();
const mockUpdateUser = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();

const roleRows = [
  { value: 'solo-developer' },
  { value: 'product-manager' },
  { value: 'designer' },
  { value: 'founder' },
  { value: 'student' },
  { value: 'other' },
];

const socialLinkTypeRows = [
  { value: 'website' },
  { value: 'github' },
  { value: 'twitter' },
  { value: 'linkedin' },
  { value: 'other' },
];

const makeLookupChain = (rows: { value: string }[]) => ({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: rows }),
  }),
});

let mockRolesChain = makeLookupChain(roleRows);
let mockLinkTypesChain = makeLookupChain(socialLinkTypeRows);

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: mockGetUser,
      updateUser: mockUpdateUser,
    },
    from: vi.fn((table: string) => {
      if (table === 'roles') {return mockRolesChain;}

      if (table === 'social_link_types') {return mockLinkTypesChain;}

      return { update: mockUpdate };
    }),
  }),
}));

const validData = {
  fullName: 'John Doe',
  role: 'solo-developer',
  bio: 'A short bio.',
  socialLinks: [],
};

describe('Settings Actions – Update Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    // Default: DB update succeeds
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });

    // Default: metadata update succeeds
    mockUpdateUser.mockResolvedValue({ error: null });

    // Reset lookup chains
    mockRolesChain = makeLookupChain(roleRows);
    mockLinkTypesChain = makeLookupChain(socialLinkTypeRows);
  });

  it('should return success when profile is updated', async () => {
    const { updateProfile } = await import('./update-profile');
    const result = await updateProfile(validData);

    expect(result).toEqual({ success: true });
    expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
    expect(mockUpdateUser).toHaveBeenCalledWith({
      data: { full_name: validData.fullName },
    });
  });

  it('should not call Supabase when form data is invalid', async () => {
    const { updateProfile } = await import('./update-profile');

    const result = await updateProfile({
      fullName: 'a'.repeat(101),
      role: '',
      bio: '',
      socialLinks: [],
    });

    expect(result.error).toBeDefined();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('should return error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { updateProfile } = await import('./update-profile');
    const result = await updateProfile(validData);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should return error when profile DB update fails', async () => {
    mockEq.mockResolvedValue({ error: { message: 'Database error' } });

    const { updateProfile } = await import('./update-profile');
    const result = await updateProfile(validData);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
    // Metadata update should not be attempted after profile update failure
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('should return error when metadata update fails', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Metadata error' } });

    const { updateProfile } = await import('./update-profile');
    const result = await updateProfile(validData);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  it('should return rate limit error when rate limited', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const { updateProfile } = await import('./update-profile');
    const result = await updateProfile(validData);

    expect(result.error).toBeDefined();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('should reject invalid role values', async () => {
    const { updateProfile } = await import('./update-profile');
    const result = await updateProfile({
      ...validData,
      role: 'not-a-real-role',
    });

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  it('should reject invalid social link labels', async () => {
    const { updateProfile } = await import('./update-profile');
    const result = await updateProfile({
      ...validData,
      socialLinks: [{ label: 'invalid-type', url: 'https://example.com' }],
    });

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });
});
