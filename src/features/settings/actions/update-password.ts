'use server';

import { updatePasswordSchema } from '@/features/settings/types';
import { withProtectedAction } from '@/lib/common/with-protected-action';
import { mapSupabaseError } from '@/lib/supabase/errors';

export const updatePassword = withProtectedAction('change-password', {
  schema: updatePasswordSchema,
  rateLimit: { limit: 3, windowSeconds: 3600 },
  action: async ({ data, user, supabase }) => {
    if (!user.email) {
      return { error: 'settings.errors.unexpected' };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: data.currentPassword,
    });

    if (signInError) {
      return { error: 'settings.errors.currentPasswordIncorrect' };
    }

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      return { error: mapSupabaseError(error.message) };
    }

    return { success: true };
  },
});
