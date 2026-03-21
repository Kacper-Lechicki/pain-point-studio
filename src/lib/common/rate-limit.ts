import { headers } from 'next/headers';

import { env } from '@/lib/common/env';

export interface RateLimitConfig {
  key: string;
  limit: number;
  windowSeconds: number;
  includeUserAgent?: boolean;
}

interface RateLimiter {
  check(config: RateLimitConfig): Promise<{ limited: boolean }>;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const CLEANUP_INTERVAL_MS = 60_000;

class InMemoryRateLimiter implements RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private lastCleanup = Date.now();

  async check(config: RateLimitConfig): Promise<{ limited: boolean }> {
    if (env.NODE_ENV !== 'production' || env.CI) {
      return { limited: false };
    }

    this.cleanup();

    const headerStore = await headers();
    const forwarded =
      headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      headerStore.get('x-real-ip')?.trim();

    if (!forwarded) {
      return { limited: true };
    }

    const ua = config.includeUserAgent ? (headerStore.get('user-agent') ?? '') : '';
    const storeKey = ua ? `${config.key}:${forwarded}:${ua}` : `${config.key}:${forwarded}`;
    const now = Date.now();
    const entry = this.store.get(storeKey);

    if (!entry || now > entry.resetAt) {
      this.store.set(storeKey, {
        count: 1,
        resetAt: now + config.windowSeconds * 1000,
      });

      return { limited: false };
    }

    entry.count += 1;

    if (entry.count > config.limit) {
      return { limited: true };
    }

    return { limited: false };
  }

  private cleanup() {
    const now = Date.now();

    if (now - this.lastCleanup < CLEANUP_INTERVAL_MS) {
      return;
    }

    this.lastCleanup = now;

    for (const [key, entry] of this.store) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

class UpstashRateLimiter implements RateLimiter {
  private limiterCache = new Map<
    string,
    InstanceType<typeof import('@upstash/ratelimit').Ratelimit>
  >();

  async check(config: RateLimitConfig): Promise<{ limited: boolean }> {
    if (env.NODE_ENV !== 'production' || env.CI) {
      return { limited: false };
    }

    const headerStore = await headers();
    const forwarded =
      headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      headerStore.get('x-real-ip')?.trim();

    if (!forwarded) {
      return { limited: true };
    }

    const ua = config.includeUserAgent ? (headerStore.get('user-agent') ?? '') : '';
    const identifier = ua ? `${forwarded}:${ua}` : forwarded;

    const limiter = await this.getLimiter(config);
    const { success } = await limiter.limit(`${config.key}:${identifier}`);

    return { limited: !success };
  }

  private async getLimiter(config: RateLimitConfig) {
    const cacheKey = `${config.key}:${config.limit}:${config.windowSeconds}`;
    const cached = this.limiterCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');

    const limiter = new Ratelimit({
      redis: new Redis({
        url: env.UPSTASH_REDIS_REST_URL!,
        token: env.UPSTASH_REDIS_REST_TOKEN!,
      }),
      limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
      prefix: 'ratelimit',
    });

    this.limiterCache.set(cacheKey, limiter);

    return limiter;
  }
}

function createLimiter(): RateLimiter {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return new UpstashRateLimiter();
  }

  return new InMemoryRateLimiter();
}

const limiter = createLimiter();

export const rateLimit = (config: RateLimitConfig) => limiter.check(config);

export { InMemoryRateLimiter, UpstashRateLimiter, createLimiter };
