'use server';

import { changePasswordSchema, setPasswordSchema } from '@/features/settings/types';
import { withProtectedAction } from '@/lib/common/with-protected-action';
import { createAdminClient } from '@/lib/supabase/admin';
import { mapSupabaseError } from '@/lib/supabase/errors';

export const changePassword = withProtectedAction('change-password', {
  schema: changePasswordSchema,
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

export const setPassword = withProtectedAction('set-password', {
  schema: setPasswordSchema,
  rateLimit: { limit: 3, windowSeconds: 3600 },
  action: async ({ data, user, supabase }) => {
    const { data: alreadyHasPassword } = await supabase.rpc('has_password');

    if (alreadyHasPassword) {
      return { error: 'settings.errors.unexpected' };
    }

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      return { error: mapSupabaseError(error.message) };
    }

    // Supabase's updateUser({password}) only sets encrypted_password — it does NOT
    // create an email identity. Without one GoTrue blocks unlinking the last OAuth
    // provider (single_identity_not_deletable). Use the admin API to ensure the
    // email identity exists so the user can later disconnect all OAuth providers.
    if (user.email) {
      const hasEmailIdentity = user.identities?.some((i) => i.provider === 'email');

      if (!hasEmailIdentity) {
        const admin = createAdminClient();
        await admin.auth.admin.updateUserById(user.id, { email: user.email });
      }
    }

    return { success: true };
  },
});
