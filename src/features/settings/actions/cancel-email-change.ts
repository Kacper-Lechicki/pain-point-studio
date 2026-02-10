'use server';

import { z } from 'zod';

import { withProtectedAction } from '@/lib/common/with-protected-action';

export const cancelEmailChange = withProtectedAction('cancel-email-change', {
  schema: z.object({}),
  rateLimit: { limit: 3, windowSeconds: 3600 },
  action: async ({ supabase }) => {
    const { error } = await supabase.rpc('cancel_email_change');

    if (error) {
      return { error: 'settings.errors.unexpected' };
    }

    return { success: true };
  },
});
