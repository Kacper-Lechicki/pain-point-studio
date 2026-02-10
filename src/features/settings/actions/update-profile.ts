'use server';

import { updateProfileSchema } from '@/features/settings/types';
import { withProtectedAction } from '@/lib/common/with-protected-action';
import { mapSupabaseError } from '@/lib/supabase/errors';

export const updateProfile = withProtectedAction('update-profile', {
  schema: updateProfileSchema,
  rateLimit: { limit: 10, windowSeconds: 300 },
  action: async ({ data, user, supabase }) => {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: data.fullName,
        role: data.role,
        bio: data.bio,
        social_links: data.socialLinks,
      })
      .eq('id', user.id);

    if (profileError) {
      return { error: mapSupabaseError(profileError.message) };
    }

    const { error: metaError } = await supabase.auth.updateUser({
      data: { full_name: data.fullName },
    });

    if (metaError) {
      return { error: mapSupabaseError(metaError.message) };
    }

    return { success: true };
  },
});
