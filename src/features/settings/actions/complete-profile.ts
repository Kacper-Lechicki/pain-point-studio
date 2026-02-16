'use server';

import { completeProfileSchema } from '@/features/settings/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';
import { mapSupabaseError } from '@/lib/supabase/errors';

export const completeProfile = withProtectedAction('complete-profile', {
  schema: completeProfileSchema,
  rateLimit: RATE_LIMITS.auth,
  action: async ({ data, user, supabase }) => {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: data.fullName,
        role: data.role,
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
