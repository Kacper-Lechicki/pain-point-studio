'use server';

import { updateEmailSchema } from '@/features/settings/types';
import { withProtectedAction } from '@/lib/common/with-protected-action';
import { mapSupabaseError } from '@/lib/supabase/errors';

export const updateEmail = withProtectedAction('update-email', {
  schema: updateEmailSchema,
  rateLimit: { limit: 3, windowSeconds: 3600 },
  action: async ({ data, supabase }) => {
    const { error } = await supabase.auth.updateUser({
      email: data.email,
    });

    if (error) {
      return { error: mapSupabaseError(error.message) };
    }

    return { success: true };
  },
});
