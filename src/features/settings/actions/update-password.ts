'use server';

import { changePasswordSchema, setPasswordSchema } from '@/features/settings/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';
import { createAuthAdmin, mapAuthError } from '@/lib/providers/server';

export const changePassword = withProtectedAction('change-password', {
  schema: changePasswordSchema,
  rateLimit: RATE_LIMITS.sensitive,
  action: async ({ data, auth, db }) => {
    // Verify the current password via an RPC that checks the hash directly,
    // instead of signInWithPassword which would create a new session and
    // invalidate the existing refresh token.
    const { data: isValid } = await db.rpc('verify_password', {
      current_plain_password: data.currentPassword,
    });

    if (!isValid) {
      return { error: 'settings.errors.currentPasswordIncorrect' };
    }

    const { error } = await auth.updateUser({
      password: data.password,
    });

    if (error) {
      return { error: mapAuthError(error.message) };
    }

    return { success: true };
  },
});

export const setPassword = withProtectedAction('set-password', {
  schema: setPasswordSchema,
  rateLimit: RATE_LIMITS.sensitive,
  action: async ({ data, user, auth, db }) => {
    const { data: alreadyHasPassword } = await db.rpc('has_password');

    if (alreadyHasPassword) {
      return { error: 'settings.errors.unexpected' };
    }

    const { error } = await auth.updateUser({
      password: data.password,
    });

    if (error) {
      return { error: mapAuthError(error.message) };
    }

    // Supabase's updateUser({password}) only sets encrypted_password — it does NOT
    // create an email identity. Without one GoTrue blocks unlinking the last OAuth
    // provider (single_identity_not_deletable). Use the admin API to ensure the
    // email identity exists so the user can later disconnect all OAuth providers.
    if (user.email) {
      const hasEmailIdentity = user.identities.some((i) => i.provider === 'email');

      if (!hasEmailIdentity) {
        const authAdmin = createAuthAdmin();
        await authAdmin.updateUserById(user.id, { email: user.email });
      }
    }

    return { success: true };
  },
});
