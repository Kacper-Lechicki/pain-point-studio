import { NextRequest } from 'next/server';

import { timingSafeEqual } from 'crypto';

import { env } from '@/lib/common/env';

export function isProtectionEnabled(): boolean {
  const isProduction = env.NODE_ENV === 'production';
  const hasAuthEnv = !!(env.BASIC_AUTH_USER && env.BASIC_AUTH_PASSWORD);

  return isProduction && hasAuthEnv;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

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

    return (
      safeEqual(user ?? '', env.BASIC_AUTH_USER ?? '') &&
      safeEqual(pwd ?? '', env.BASIC_AUTH_PASSWORD ?? '')
    );
  } catch {
    return false;
  }
}
