// @vitest-environment node
/** Rate limiter: token bucket algorithm and request throttling. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock env — production by default (rate limiting is active only in production)
const mockEnv = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_APP_URL: 'https://example.com',
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
};

vi.mock('@/lib/common/env', () => ({
  env: mockEnv,
}));

// Mock next/headers
const mockHeaders = new Map<string, string>();

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: (key: string) => mockHeaders.get(key) ?? null,
  }),
}));

describe('rate-limit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.clear();
    mockHeaders.set('x-forwarded-for', '192.168.1.1');
    mockEnv.NODE_ENV = 'production';

    // Reset module to get a fresh InMemoryRateLimiter instance
    vi.resetModules();
  });

  it('should allow requests within the limit', async () => {
    const { rateLimit } = await import('./rate-limit');
    const result1 = await rateLimit({ key: 'test-action', limit: 3, windowSeconds: 60 });
    const result2 = await rateLimit({ key: 'test-action', limit: 3, windowSeconds: 60 });
    const result3 = await rateLimit({ key: 'test-action', limit: 3, windowSeconds: 60 });

    expect(result1.limited).toBe(false);
    expect(result2.limited).toBe(false);
    expect(result3.limited).toBe(false);
  });

  it('should block requests exceeding the limit', async () => {
    const { rateLimit } = await import('./rate-limit');
    const config = { key: 'test-block', limit: 2, windowSeconds: 60 };

    await rateLimit(config); // 1
    await rateLimit(config); // 2

    const result = await rateLimit(config); // 3 — should be blocked

    expect(result.limited).toBe(true);
  });

  it('should track different keys independently', async () => {
    const { rateLimit } = await import('./rate-limit');

    await rateLimit({ key: 'action-a', limit: 1, windowSeconds: 60 });
    await rateLimit({ key: 'action-a', limit: 1, windowSeconds: 60 }); // blocked

    const resultA = await rateLimit({ key: 'action-a', limit: 1, windowSeconds: 60 });
    const resultB = await rateLimit({ key: 'action-b', limit: 1, windowSeconds: 60 });

    expect(resultA.limited).toBe(true);
    expect(resultB.limited).toBe(false);
  });

  it('should track different IPs independently', async () => {
    const { rateLimit } = await import('./rate-limit');
    const config = { key: 'test-ip', limit: 1, windowSeconds: 60 };

    // First IP hits limit
    mockHeaders.set('x-forwarded-for', '10.0.0.1');

    await rateLimit(config);

    const blocked = await rateLimit(config);
    expect(blocked.limited).toBe(true);

    // Second IP is independent
    mockHeaders.set('x-forwarded-for', '10.0.0.2');

    const allowed = await rateLimit(config);
    expect(allowed.limited).toBe(false);
  });

  it('should skip rate limiting outside production', async () => {
    mockEnv.NODE_ENV = 'development';

    const { rateLimit } = await import('./rate-limit');
    const config = { key: 'test-dev', limit: 1, windowSeconds: 60 };

    await rateLimit(config);
    await rateLimit(config);

    const result = await rateLimit(config);

    expect(result.limited).toBe(false);
  });

  it('should handle missing x-forwarded-for header', async () => {
    mockHeaders.delete('x-forwarded-for');

    const { rateLimit } = await import('./rate-limit');
    const config = { key: 'test-no-ip', limit: 1, windowSeconds: 60 };

    await rateLimit(config);

    const result = await rateLimit(config);

    // Should still work using 'unknown' as the IP key
    expect(result.limited).toBe(true);
  });

  it('should reset after the time window expires', async () => {
    const { rateLimit } = await import('./rate-limit');
    const config = { key: 'test-expire', limit: 1, windowSeconds: 1 };

    await rateLimit(config);

    const blocked = await rateLimit(config);

    expect(blocked.limited).toBe(true);

    // Advance time past the window
    vi.useFakeTimers();
    vi.advanceTimersByTime(1500);

    const allowed = await rateLimit(config);

    expect(allowed.limited).toBe(false);

    vi.useRealTimers();
  });
});
