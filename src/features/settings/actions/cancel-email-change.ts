'use server';

import { z } from 'zod';

import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const cancelEmailChange = withProtectedAction('cancel-email-change', {
  schema: z.object({}),
  rateLimit: RATE_LIMITS.sensitive,
  action: async ({ supabase }) => {
    const { error } = await supabase.rpc('cancel_email_change');

    if (error) {
      return { error: 'settings.errors.unexpected' };
    }

    return { success: true };
  },
});
