import { headers } from 'next/headers';

import { env } from '@/lib/common/env';

export interface RateLimitConfig {
  /** Unique identifier for this rate limit (e.g. 'sign-in', 'reset-password') */
  key: string;
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

export interface RateLimiter {
  check(config: RateLimitConfig): Promise<{ limited: boolean }>;
}

// TODO(scaling): Replace with Redis-backed implementation for multi-instance deployments.
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const CLEANUP_INTERVAL_MS = 60_000;

class InMemoryRateLimiter implements RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private lastCleanup = Date.now();

  async check(config: RateLimitConfig): Promise<{ limited: boolean }> {
    // Skip rate limiting outside production and in CI.
    // NODE_ENV is baked in at build time by Next.js — on CI the production build
    // has NODE_ENV=production, so we also check the runtime CI env var.
    // Without this, parallel Playwright browser projects sharing one IP would
    // exhaust low limits (e.g. delete-account: 1/hour) after the first project.
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

/**
 * Simple in-memory rate limiter for server actions.
 * Uses IP address + action key for tracking.
 *
 * Sufficient for single-instance MVP deployments.
 * For multi-instance, swap `InMemoryRateLimiter` with a Redis-based implementation.
 */
export const rateLimit = (config: RateLimitConfig) => limiter.check(config);
