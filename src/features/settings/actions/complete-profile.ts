'use server';

import { completeProfileSchema } from '@/features/settings/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';
import { mapAuthError } from '@/lib/providers/server';

export const completeProfile = withProtectedAction('complete-profile', {
  schema: completeProfileSchema,
  rateLimit: RATE_LIMITS.auth,
  action: async ({ data, user, auth, db }) => {
    const { error: profileError } = await db.profiles.update(user.id, {
      full_name: data.fullName,
      role: data.role,
    });

    if (profileError) {
      return { error: mapAuthError(profileError.message) };
    }

    const { error: metaError } = await auth.updateUser({
      data: { full_name: data.fullName },
    });

    if (metaError) {
      return { error: mapAuthError(metaError.message) };
    }

    return { success: true };
  },
});
