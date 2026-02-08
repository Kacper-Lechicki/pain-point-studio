'use server';

import { z } from 'zod';

import { mapAuthError } from '@/features/auth/config';
import { ActionResult } from '@/lib/common/types';
import { createClient } from '@/lib/supabase/server';

const avatarUrlSchema = z.object({
  avatarUrl: z.union([z.url(), z.literal('')]),
});

/**
 * Updates the avatar URL in the profiles table and user metadata.
 * The actual file upload happens client-side via the Supabase Storage SDK.
 */
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

  // Update profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      avatar_url: validation.data.avatarUrl,
    })
    .eq('id', user.id);

  if (profileError) {
    return { error: mapAuthError(profileError.message) };
  }

  // Keep user_metadata.avatar_url in sync for UserMenu
  const { error: metaError } = await supabase.auth.updateUser({
    data: { avatar_url: validation.data.avatarUrl },
  });

  if (metaError) {
    return { error: mapAuthError(metaError.message) };
  }

  return { success: true };
};
