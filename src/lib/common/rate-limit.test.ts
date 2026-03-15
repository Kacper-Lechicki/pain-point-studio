// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockEnv: Record<string, string | undefined> = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_APP_URL: 'https://example.com',
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
};

vi.mock('@/lib/common/env', () => ({
  env: mockEnv,
}));

const mockHeaders = new Map<string, string>();

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: (key: string) => mockHeaders.get(key) ?? null,
  }),
}));

const mockLimit = vi.fn().mockResolvedValue({ success: true });

vi.mock('@upstash/ratelimit', () => {
  class MockRatelimit {
    limit = mockLimit;
    static slidingWindow = vi.fn().mockReturnValue('sliding-window-config');
  }

  return { Ratelimit: MockRatelimit };
});

vi.mock('@upstash/redis', () => {
  class MockRedis {}

  return { Redis: MockRedis };
});

describe('rate-limit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.clear();
    mockHeaders.set('x-forwarded-for', '192.168.1.1');
    mockEnv.NODE_ENV = 'production';
    delete mockEnv.UPSTASH_REDIS_REST_URL;
    delete mockEnv.UPSTASH_REDIS_REST_TOKEN;
    vi.resetModules();
  });

  describe('InMemoryRateLimiter', () => {
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

      await rateLimit(config);
      await rateLimit(config);

      const result = await rateLimit(config);

      expect(result.limited).toBe(true);
    });

    it('should track different keys independently', async () => {
      const { rateLimit } = await import('./rate-limit');

      await rateLimit({ key: 'action-a', limit: 1, windowSeconds: 60 });
      await rateLimit({ key: 'action-a', limit: 1, windowSeconds: 60 });

      const resultA = await rateLimit({ key: 'action-a', limit: 1, windowSeconds: 60 });
      const resultB = await rateLimit({ key: 'action-b', limit: 1, windowSeconds: 60 });

      expect(resultA.limited).toBe(true);
      expect(resultB.limited).toBe(false);
    });

    it('should track different IPs independently', async () => {
      const { rateLimit } = await import('./rate-limit');
      const config = { key: 'test-ip', limit: 1, windowSeconds: 60 };

      mockHeaders.set('x-forwarded-for', '10.0.0.1');
      await rateLimit(config);

      const blocked = await rateLimit(config);
      expect(blocked.limited).toBe(true);

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

      expect(result.limited).toBe(true);
    });

    it('should reset after the time window expires', async () => {
      const { rateLimit } = await import('./rate-limit');
      const config = { key: 'test-expire', limit: 1, windowSeconds: 1 };

      await rateLimit(config);

      const blocked = await rateLimit(config);
      expect(blocked.limited).toBe(true);

      vi.useFakeTimers();
      vi.advanceTimersByTime(1500);

      const allowed = await rateLimit(config);
      expect(allowed.limited).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('UpstashRateLimiter', () => {
    it('should use Upstash when env vars are set', async () => {
      mockEnv.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      mockEnv.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const { createLimiter, UpstashRateLimiter } = await import('./rate-limit');
      const limiter = createLimiter();

      expect(limiter).toBeInstanceOf(UpstashRateLimiter);
    });

    it('should delegate to Upstash ratelimit', async () => {
      mockEnv.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      mockEnv.UPSTASH_REDIS_REST_TOKEN = 'test-token';
      mockLimit.mockResolvedValue({ success: true });

      const { rateLimit } = await import('./rate-limit');
      const result = await rateLimit({ key: 'test-upstash', limit: 10, windowSeconds: 60 });

      expect(result.limited).toBe(false);
      expect(mockLimit).toHaveBeenCalledWith('test-upstash:192.168.1.1');
    });

    it('should rate limit when Upstash returns not success', async () => {
      mockEnv.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      mockEnv.UPSTASH_REDIS_REST_TOKEN = 'test-token';
      mockLimit.mockResolvedValue({ success: false });

      const { rateLimit } = await import('./rate-limit');
      const result = await rateLimit({ key: 'test-blocked', limit: 1, windowSeconds: 60 });

      expect(result.limited).toBe(true);
    });

    it('should block requests with missing IP', async () => {
      mockEnv.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      mockEnv.UPSTASH_REDIS_REST_TOKEN = 'test-token';
      mockHeaders.delete('x-forwarded-for');

      const { rateLimit } = await import('./rate-limit');
      const result = await rateLimit({ key: 'test-no-ip', limit: 10, windowSeconds: 60 });

      expect(result.limited).toBe(true);
      expect(mockLimit).not.toHaveBeenCalled();
    });
  });

  describe('createLimiter fallback', () => {
    it('should fall back to in-memory when Upstash vars missing', async () => {
      const { createLimiter, InMemoryRateLimiter } = await import('./rate-limit');
      const limiter = createLimiter();

      expect(limiter).toBeInstanceOf(InMemoryRateLimiter);
    });

    it('should fall back to in-memory when only URL is set', async () => {
      mockEnv.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';

      const { createLimiter, InMemoryRateLimiter } = await import('./rate-limit');
      const limiter = createLimiter();

      expect(limiter).toBeInstanceOf(InMemoryRateLimiter);
    });
  });
});
