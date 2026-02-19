'use server';

import { rateLimit } from '@/lib/common/rate-limit';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { ActionResult } from '@/lib/common/types';
import { createServerAuth, mapAuthError } from '@/lib/providers/server';

export const signOut = async (): Promise<ActionResult> => {
  const { limited } = await rateLimit({ key: 'sign-out', ...RATE_LIMITS.signOut });

  if (limited) {
    return { error: 'common.errors.rateLimitExceeded' };
  }

  const auth = await createServerAuth();
  const { error } = await auth.signOut();

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  return { success: true };
};
