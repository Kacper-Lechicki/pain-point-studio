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

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: mockGetUser,
      updateUser: mockUpdateUser,
    },
    from: vi.fn(() => ({ update: mockUpdate })),
  }),
}));

const validData = {
  fullName: 'John Doe',
  role: 'solo-developer',
};

describe('Settings Actions – Complete Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });

    mockUpdateUser.mockResolvedValue({ error: null });
  });

  it('should return success when profile is completed', async () => {
    const { completeProfile } = await import('./complete-profile');
    const result = await completeProfile(validData);

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith({
      full_name: 'John Doe',
      role: 'solo-developer',
    });
    expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
    expect(mockUpdateUser).toHaveBeenCalledWith({
      data: { full_name: 'John Doe' },
    });
  });

  it('should reject empty fullName', async () => {
    const { completeProfile } = await import('./complete-profile');
    const result = await completeProfile({ fullName: '', role: 'other' });

    expect(result.error).toBeDefined();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('should reject empty role', async () => {
    const { completeProfile } = await import('./complete-profile');
    const result = await completeProfile({ fullName: 'John', role: '' });

    expect(result.error).toBeDefined();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('should reject fullName exceeding max length', async () => {
    const { completeProfile } = await import('./complete-profile');
    const result = await completeProfile({
      fullName: 'a'.repeat(101),
      role: 'other',
    });

    expect(result.error).toBeDefined();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('should return error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { completeProfile } = await import('./complete-profile');
    const result = await completeProfile(validData);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should return error when profile DB update fails', async () => {
    mockEq.mockResolvedValue({ error: { message: 'Database error' } });

    const { completeProfile } = await import('./complete-profile');
    const result = await completeProfile(validData);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('should return error when metadata update fails', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Metadata error' } });

    const { completeProfile } = await import('./complete-profile');
    const result = await completeProfile(validData);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  it('should return rate limit error when rate limited', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const { completeProfile } = await import('./complete-profile');
    const result = await completeProfile(validData);

    expect(result.error).toBeDefined();
    expect(mockGetUser).not.toHaveBeenCalled();
  });
});
