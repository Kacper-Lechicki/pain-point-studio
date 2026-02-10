'use server';

import { z } from 'zod';

import { withProtectedAction } from '@/lib/common/with-protected-action';
import { mapSupabaseError } from '@/lib/supabase/errors';

const avatarUrlSchema = z.object({
  avatarUrl: z.union([z.url(), z.literal('')]),
});

export const updateAvatarUrl = withProtectedAction('update-avatar-url', {
  schema: avatarUrlSchema,
  rateLimit: { limit: 10, windowSeconds: 60 },
  action: async ({ data, user, supabase }) => {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        avatar_url: data.avatarUrl,
      })
      .eq('id', user.id);

    if (profileError) {
      return { error: mapSupabaseError(profileError.message) };
    }

    const { error: metaError } = await supabase.auth.updateUser({
      data: { avatar_url: data.avatarUrl },
    });

    if (metaError) {
      return { error: mapSupabaseError(metaError.message) };
    }

    return { success: true };
  },
});
