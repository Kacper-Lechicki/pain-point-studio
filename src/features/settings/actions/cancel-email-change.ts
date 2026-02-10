'use server';

import { z } from 'zod';

import { withProtectedAction } from '@/lib/common/with-protected-action';
import { createAdminClient } from '@/lib/supabase/admin';

export const cancelEmailChange = withProtectedAction('cancel-email-change', {
  schema: z.object({}),
  rateLimit: { limit: 3, windowSeconds: 3600 },
  action: async ({ user }) => {
    if (!user.email) {
      return { error: 'settings.errors.unexpected' };
    }

    const admin = createAdminClient();

    const { error } = await admin.auth.admin.updateUserById(user.id, {
      email: user.email,
    });

    if (error) {
      return { error: 'settings.errors.unexpected' };
    }

    return { success: true };
  },
});
