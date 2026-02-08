'use server';

import { mapAuthError } from '@/features/auth/config';
import { UpdateProfileSchema, updateProfileSchema } from '@/features/settings/types';
import { rateLimit } from '@/lib/common/rate-limit';
import { ActionResult } from '@/lib/common/types';
import { createClient } from '@/lib/supabase/server';

export const updateProfile = async (formData: UpdateProfileSchema): Promise<ActionResult> => {
  const { limited } = await rateLimit({ key: 'update-profile', limit: 10, windowSeconds: 300 });

  if (limited) {
    return { error: 'settings.errors.rateLimitExceeded' };
  }

  const validation = updateProfileSchema.safeParse(formData);

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
      full_name: validation.data.fullName,
      role: validation.data.role,
      bio: validation.data.bio,
      social_links: validation.data.socialLinks,
    })
    .eq('id', user.id);

  if (profileError) {
    return { error: mapAuthError(profileError.message) };
  }

  // Keep user_metadata.full_name in sync for UserMenu avatar initials
  const { error: metaError } = await supabase.auth.updateUser({
    data: { full_name: validation.data.fullName },
  });

  if (metaError) {
    return { error: mapAuthError(metaError.message) };
  }

  return { success: true };
};
