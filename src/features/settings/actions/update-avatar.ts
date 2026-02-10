'use server';

import { z } from 'zod';

import { ActionResult } from '@/lib/common/types';
import { mapSupabaseError } from '@/lib/supabase/errors';
import { createClient } from '@/lib/supabase/server';

const avatarUrlSchema = z.object({
  avatarUrl: z.union([z.url(), z.literal('')]),
});

export const updateAvatarUrl = async (avatarUrl: string): Promise<ActionResult> => {
  const validation = avatarUrlSchema.safeParse({ avatarUrl });

  if (!validation.success) {
    return { error: 'settings.errors.invalidData' };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'settings.errors.unexpected' };
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      avatar_url: validation.data.avatarUrl,
    })
    .eq('id', user.id);

  if (profileError) {
    return { error: mapSupabaseError(profileError.message) };
  }

  const { error: metaError } = await supabase.auth.updateUser({
    data: { avatar_url: validation.data.avatarUrl },
  });

  if (metaError) {
    return { error: mapSupabaseError(metaError.message) };
  }

  return { success: true };
};
