// @vitest-environment node
/** withProtectedAction: auth guard wrapper for server actions. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

vi.mock('@/lib/common/env', () => ({
  env: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_APP_URL: 'https://example.com',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

vi.mock('@/lib/common/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ limited: false }),
}));

const mockRawUser = {
  id: 'user-123',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  user_metadata: {},
  identities: [],
};

const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: mockRawUser },
  error: null,
});

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: vi.fn(),
  storage: { from: vi.fn() },
  rpc: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

vi.mock('@/lib/supabase/user-mapper', () => ({
  mapSupabaseUser: vi.fn((user: typeof mockRawUser) => ({
    id: user.id,
    email: user.email,
    identities: [],
    userMetadata: user.user_metadata,
    createdAt: user.created_at,
  })),
}));

const testSchema = z.object({
  name: z.string().min(1),
});

describe('withProtectedAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockRawUser }, error: null });
  });

  it('should call the action with validated data, user, and supabase client', async () => {
    const actionFn = vi.fn().mockResolvedValue({ success: true });

    const { withProtectedAction } = await import('./with-protected-action');

    const protectedAction = withProtectedAction('test-action', {
      schema: testSchema,
      rateLimit: { limit: 5, windowSeconds: 60 },
      action: actionFn,
    });

    const result = await protectedAction({ name: 'John' });

    expect(result).toEqual({ success: true });

    expect(actionFn).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: 'John' },
        user: expect.objectContaining({ id: 'user-123', email: 'test@example.com' }),
        supabase: mockSupabase,
      })
    );
  });

  it('should return rate limit error when rate limited', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const actionFn = vi.fn();
    const { withProtectedAction } = await import('./with-protected-action');

    const protectedAction = withProtectedAction('test-action', {
      schema: testSchema,
      rateLimit: { limit: 5, windowSeconds: 60 },
      action: actionFn,
    });

    const result = await protectedAction({ name: 'John' });

    expect(result.error).toBeDefined();
    expect(actionFn).not.toHaveBeenCalled();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('should use custom rate limit error message', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const { withProtectedAction } = await import('./with-protected-action');

    const protectedAction = withProtectedAction('test-action', {
      schema: testSchema,
      rateLimit: { limit: 5, windowSeconds: 60 },
      rateLimitError: 'custom.rateLimitMessage',
      action: vi.fn(),
    });

    const result = await protectedAction({ name: 'John' });

    expect(result.error).toBe('custom.rateLimitMessage');
  });

  it('should return validation error for invalid data', async () => {
    const actionFn = vi.fn();

    const { withProtectedAction } = await import('./with-protected-action');

    const protectedAction = withProtectedAction('test-action', {
      schema: testSchema,
      rateLimit: { limit: 5, windowSeconds: 60 },
      action: actionFn,
    });

    const result = await protectedAction({ name: '' });

    expect(result.error).toBeDefined();
    expect(actionFn).not.toHaveBeenCalled();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('should use custom validation error message', async () => {
    const { withProtectedAction } = await import('./with-protected-action');

    const protectedAction = withProtectedAction('test-action', {
      schema: testSchema,
      rateLimit: { limit: 5, windowSeconds: 60 },
      validationError: 'custom.validationMessage',
      action: vi.fn(),
    });

    const result = await protectedAction({ name: '' });

    expect(result.error).toBe('custom.validationMessage');
  });

  it('should return error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const actionFn = vi.fn();
    const { withProtectedAction } = await import('./with-protected-action');

    const protectedAction = withProtectedAction('test-action', {
      schema: testSchema,
      rateLimit: { limit: 5, windowSeconds: 60 },
      action: actionFn,
    });

    const result = await protectedAction({ name: 'John' });

    expect(result.error).toBe('settings.errors.unexpected');
    expect(actionFn).not.toHaveBeenCalled();
  });

  it('should return error when auth returns an error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Session expired' },
    });

    const actionFn = vi.fn();
    const { withProtectedAction } = await import('./with-protected-action');

    const protectedAction = withProtectedAction('test-action', {
      schema: testSchema,
      rateLimit: { limit: 5, windowSeconds: 60 },
      action: actionFn,
    });

    const result = await protectedAction({ name: 'John' });

    expect(result.error).toBe('settings.errors.unexpected');
    expect(actionFn).not.toHaveBeenCalled();
  });

  it('should pass the rate limit key correctly', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');
    const { withProtectedAction } = await import('./with-protected-action');

    const protectedAction = withProtectedAction('my-unique-key', {
      schema: testSchema,
      rateLimit: { limit: 10, windowSeconds: 120 },
      action: vi.fn().mockResolvedValue({ success: true }),
    });

    await protectedAction({ name: 'John' });

    expect(rateLimit).toHaveBeenCalledWith({
      key: 'my-unique-key',
      limit: 10,
      windowSeconds: 120,
    });
  });
});
