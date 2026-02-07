import { headers } from 'next/headers';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();

  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }

  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

interface RateLimitConfig {
  /** Unique identifier for this rate limit (e.g. 'sign-in', 'reset-password') */
  key: string;
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

/**
 * Simple in-memory rate limiter for server actions.
 * Uses IP address + action key for tracking.
 *
 * Sufficient for single-instance MVP deployments.
 * For multi-instance, replace with Redis-based solution (e.g. @upstash/ratelimit).
 */
export async function rateLimit(config: RateLimitConfig): Promise<{ limited: boolean }> {
  cleanup();

  const headerStore = await headers();
  const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const storeKey = `${config.key}:${ip}`;
  const now = Date.now();

  const entry = store.get(storeKey);

  if (!entry || now > entry.resetAt) {
    store.set(storeKey, {
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
