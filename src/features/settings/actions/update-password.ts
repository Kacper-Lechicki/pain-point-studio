'use server';

import { changePasswordSchema, setPasswordSchema } from '@/features/settings/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';
import { createAdminClient } from '@/lib/supabase/admin';
import { mapSupabaseError } from '@/lib/supabase/errors';

export const changePassword = withProtectedAction('change-password', {
  schema: changePasswordSchema,
  rateLimit: RATE_LIMITS.sensitive,
  action: async ({ data, supabase }) => {
    // Verify the current password via an RPC that checks the hash directly,
    // instead of signInWithPassword which would create a new session and
    // invalidate the existing refresh token.
    const { data: isValid } = await supabase.rpc('verify_password', {
      current_plain_password: data.currentPassword,
    });

    if (!isValid) {
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
  rateLimit: RATE_LIMITS.sensitive,
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
      const hasEmailIdentity = user.identities.some((i) => i.provider === 'email');

      if (!hasEmailIdentity) {
        const admin = createAdminClient();
        await admin.auth.admin.updateUserById(user.id, { email: user.email });
      }
    }

    return { success: true };
  },
});
