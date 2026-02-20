'use server';

import { rateLimit } from '@/lib/common/rate-limit';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { ActionResult } from '@/lib/common/types';
import { mapSupabaseError } from '@/lib/supabase/errors';
import { createClient } from '@/lib/supabase/server';

export const signOut = async (): Promise<ActionResult> => {
  const { limited } = await rateLimit({ key: 'sign-out', ...RATE_LIMITS.signOut });

  if (limited) {
    return { error: 'auth.errors.rateLimitExceeded' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: mapSupabaseError(error.message) };
  }

  return { success: true };
};
