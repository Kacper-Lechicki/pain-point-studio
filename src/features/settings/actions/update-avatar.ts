'use server';

import { z } from 'zod';

import { env } from '@/lib/common/env';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';
import { mapSupabaseError } from '@/lib/supabase/errors';

const ALLOWED_AVATAR_HOSTS: string[] = [
  'lh3.googleusercontent.com',
  'avatars.githubusercontent.com',
];

try {
  ALLOWED_AVATAR_HOSTS.push(new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname);
} catch {
  // env not available in test; Supabase hostname will be validated at runtime
}

const avatarUrlSchema = z.object({
  avatarUrl: z.union([
    z.url().refine((url) => {
      try {
        return ALLOWED_AVATAR_HOSTS.includes(new URL(url).hostname);
      } catch {
        return false;
      }
    }, 'Avatar URL must be from a trusted source'),
    z.literal(''),
  ]),
});

export const updateAvatarUrl = withProtectedAction('update-avatar-url', {
  schema: avatarUrlSchema,
  rateLimit: RATE_LIMITS.upload,
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
