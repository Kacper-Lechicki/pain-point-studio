/**
 * In-memory rate limiter keyed by IP (x-forwarded-for). Used by withProtectedAction
 * and withPublicAction to cap request frequency per action. Disabled outside
 * production and when CI is set (avoids failing E2E that share an IP).
 * In production, requests without x-forwarded-for are treated as rate limited to avoid
 * a single shared bucket for all such clients.
 * TODO(scaling): Replace with Redis-backed implementation for multi-instance deployments
 * and atomic increments under concurrent requests.
 */
import { headers } from 'next/headers';

import { env } from '@/lib/common/env';

export interface RateLimitConfig {
  key: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimiter {
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
    const forwarded = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim();

    if (!forwarded) {
      return { limited: true };
    }

    const storeKey = `${config.key}:${forwarded}`;
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

const limiter = new InMemoryRateLimiter();

export const rateLimit = (config: RateLimitConfig) => limiter.check(config);
