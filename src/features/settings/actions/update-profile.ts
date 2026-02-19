'use server';

import { updateProfileSchema } from '@/features/settings/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';
import { mapAuthError } from '@/lib/providers/server';

export const updateProfile = withProtectedAction('update-profile', {
  schema: updateProfileSchema,
  rateLimit: RATE_LIMITS.profileUpdate,
  action: async ({ data, user, auth, db }) => {
    const { error: profileError } = await db.profiles.update(user.id, {
      full_name: data.fullName,
      role: data.role,
      bio: data.bio,
      social_links: data.socialLinks,
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
