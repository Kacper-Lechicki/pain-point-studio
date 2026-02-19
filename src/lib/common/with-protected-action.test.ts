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

const mockSupabase = { auth: {}, from: vi.fn(), storage: {} };

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

const mockGetUser = vi.fn();
const mockAuth = { getUser: mockGetUser } as Record<string, unknown>;
const mockDb = { profiles: {}, surveys: {} } as Record<string, unknown>;
const mockStorage = { upload: vi.fn() } as Record<string, unknown>;

vi.mock('@/lib/supabase/providers/auth.server', () => ({
  createServerAuthProvider: vi.fn().mockReturnValue(mockAuth),
}));

vi.mock('@/lib/supabase/providers/database', () => ({
  createSupabaseDatabaseClient: vi.fn().mockReturnValue(mockDb),
}));

vi.mock('@/lib/supabase/providers/storage.server', () => ({
  createServerStorageProvider: vi.fn().mockReturnValue(mockStorage),
}));

const testSchema = z.object({
  name: z.string().min(1),
});

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  identities: [],
  userMetadata: {},
  createdAt: '2024-01-01T00:00:00Z',
};

describe('withProtectedAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  it('should call the action with validated data, user, and provider objects', async () => {
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
        user: mockUser,
        auth: mockAuth,
        db: mockDb,
        storage: mockStorage,
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
