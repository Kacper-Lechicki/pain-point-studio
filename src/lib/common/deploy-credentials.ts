import { NextRequest } from 'next/server';

import { env } from '@/lib/common/env';

/**
 * Checks if the Basic Auth protection should be enabled.
 * It is enabled only in production and if the required environment variables are set.
 */
export function isProtectionEnabled(): boolean {
  const isProduction = env.NODE_ENV === 'production';
  const hasAuthEnv = !!(env.BASIC_AUTH_USER && env.BASIC_AUTH_PASSWORD);

  return isProduction && hasAuthEnv;
}

/**
 * Validates the Basic Auth credentials from the request headers.
 */
export function isAuthenticated(req: NextRequest): boolean {
  const basicAuth = req.headers.get('authorization');

  if (!basicAuth) {
    return false;
  }

  const authValue = basicAuth.split(' ')[1];

  if (!authValue) {
    return false;
  }

  try {
    const [user, pwd] = atob(authValue).split(':');

    return user === env.BASIC_AUTH_USER && pwd === env.BASIC_AUTH_PASSWORD;
  } catch {
    return false;
  }
}
