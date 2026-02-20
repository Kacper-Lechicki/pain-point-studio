// @vitest-environment node
/** withPublicAction: public server action wrapper with rate limiting and validation. */
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

const mockSupabase = { auth: {}, from: vi.fn(), rpc: vi.fn() };

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

const testSchema = z.object({
  name: z.string().min(1),
});

describe('withPublicAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call the action with validated data and supabase client', async () => {
    const actionFn = vi.fn().mockResolvedValue({ success: true });
    const { withPublicAction } = await import('./with-public-action');

    const publicAction = withPublicAction('test-action', {
      schema: testSchema,
      rateLimit: { limit: 5, windowSeconds: 60 },
      action: actionFn,
    });

    const result = await publicAction({ name: 'John' });

    expect(result).toEqual({ success: true });

    expect(actionFn).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: 'John' },
        supabase: mockSupabase,
      })
    );
  });

  it('should return rate limit error when rate limited', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const actionFn = vi.fn();
    const { withPublicAction } = await import('./with-public-action');

    const publicAction = withPublicAction('test-action', {
      schema: testSchema,
      rateLimit: { limit: 5, windowSeconds: 60 },
      action: actionFn,
    });

    const result = await publicAction({ name: 'John' });

    expect(result.error).toBeDefined();
    expect(actionFn).not.toHaveBeenCalled();
  });

  it('should use custom rate limit error message', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const { withPublicAction } = await import('./with-public-action');

    const publicAction = withPublicAction('test-action', {
      schema: testSchema,
      rateLimit: { limit: 5, windowSeconds: 60 },
      rateLimitError: 'custom.rateLimitMessage',
      action: vi.fn(),
    });

    const result = await publicAction({ name: 'John' });

    expect(result.error).toBe('custom.rateLimitMessage');
  });

  it('should return validation error for invalid data', async () => {
    const actionFn = vi.fn();
    const { withPublicAction } = await import('./with-public-action');

    const publicAction = withPublicAction('test-action', {
      schema: testSchema,
      rateLimit: { limit: 5, windowSeconds: 60 },
      action: actionFn,
    });

    const result = await publicAction({ name: '' });

    expect(result.error).toBeDefined();
    expect(actionFn).not.toHaveBeenCalled();
  });

  it('should use custom validation error message', async () => {
    const { withPublicAction } = await import('./with-public-action');

    const publicAction = withPublicAction('test-action', {
      schema: testSchema,
      rateLimit: { limit: 5, windowSeconds: 60 },
      validationError: 'custom.validationMessage',
      action: vi.fn(),
    });

    const result = await publicAction({ name: '' });

    expect(result.error).toBe('custom.validationMessage');
  });

  it('should use default rate limit error when not customized', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const { withPublicAction } = await import('./with-public-action');

    const publicAction = withPublicAction('test-action', {
      schema: testSchema,
      rateLimit: { limit: 5, windowSeconds: 60 },
      action: vi.fn(),
    });

    const result = await publicAction({ name: 'John' });

    expect(result.error).toBe('common.errors.rateLimitExceeded');
  });

  it('should use default validation error when not customized', async () => {
    const { withPublicAction } = await import('./with-public-action');

    const publicAction = withPublicAction('test-action', {
      schema: testSchema,
      rateLimit: { limit: 5, windowSeconds: 60 },
      action: vi.fn(),
    });

    const result = await publicAction({ name: '' });

    expect(result.error).toBe('common.errors.invalidData');
  });

  it('should pass the rate limit key correctly', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');
    const { withPublicAction } = await import('./with-public-action');

    const publicAction = withPublicAction('my-unique-key', {
      schema: testSchema,
      rateLimit: { limit: 10, windowSeconds: 120 },
      action: vi.fn().mockResolvedValue({ success: true }),
    });

    await publicAction({ name: 'John' });

    expect(rateLimit).toHaveBeenCalledWith({
      key: 'my-unique-key',
      limit: 10,
      windowSeconds: 120,
    });
  });
});
