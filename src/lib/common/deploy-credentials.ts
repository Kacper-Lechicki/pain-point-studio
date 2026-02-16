/**
 * Basic Auth for deploy/preview protection. When NODE_ENV is production and
 * BASIC_AUTH_* env vars are set, the app middleware challenges with 401 until
 * valid credentials are provided. Uses timing-safe comparison to avoid leaks.
 */
import { NextRequest } from 'next/server';

import { timingSafeEqual } from 'crypto';

import { env } from '@/lib/common/env';

/** True only in production with both BASIC_AUTH_USER and BASIC_AUTH_PASSWORD set. */
export function isProtectionEnabled(): boolean {
  const isProduction = env.NODE_ENV === 'production';
  const hasAuthEnv = !!(env.BASIC_AUTH_USER && env.BASIC_AUTH_PASSWORD);

  return isProduction && hasAuthEnv;
}

/** Constant-time string comparison to prevent timing side-channels. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  const maxLen = Math.max(bufA.length, bufB.length);

  const paddedA = Buffer.alloc(maxLen);
  const paddedB = Buffer.alloc(maxLen);

  bufA.copy(paddedA);
  bufB.copy(paddedB);

  return bufA.length === bufB.length && timingSafeEqual(paddedA, paddedB);
}

/** Validates Authorization: Basic <base64(user:password)> against env credentials. */
export function isAuthenticated(req: NextRequest): boolean {
  const authorization = req.headers.get('authorization');

  if (!authorization || !authorization.startsWith('Basic ')) {
    return false;
  }

  const authValue = authorization.slice(6).trim();

  if (!authValue) {
    return false;
  }

  try {
    const decoded = atob(authValue);
    const colonIndex = decoded.indexOf(':');

    if (colonIndex === -1) {
      return false;
    }

    const user = decoded.slice(0, colonIndex);
    const pwd = decoded.slice(colonIndex + 1);

    return (
      safeEqual(user, env.BASIC_AUTH_USER ?? '') && safeEqual(pwd, env.BASIC_AUTH_PASSWORD ?? '')
    );
  } catch {
    return false;
  }
}
