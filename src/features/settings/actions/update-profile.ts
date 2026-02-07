'use server';

import { mapAuthError } from '@/features/auth/config';
import { AuthActionResult } from '@/features/auth/types';
import { UpdateProfileSchema, updateProfileSchema } from '@/features/settings/types';
import { rateLimit } from '@/lib/common/rate-limit';
import { createClient } from '@/lib/supabase/server';

export const updateProfile = async (formData: UpdateProfileSchema): Promise<AuthActionResult> => {
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

  // Validate role and social link labels against lookup tables
  const [{ data: roles }, { data: linkTypes }] = await Promise.all([
    supabase.from('roles').select('value').eq('is_active', true),
    supabase.from('social_link_types').select('value').eq('is_active', true),
  ]);

  const allowedRoles = (roles ?? []).map((r) => r.value);
  const allowedLinkTypes = (linkTypes ?? []).map((l) => l.value);

  if (validation.data.role !== '' && !allowedRoles.includes(validation.data.role)) {
    return { error: 'settings.errors.invalidData' };
  }

  const hasInvalidLabel = validation.data.socialLinks.some(
    (link) => !allowedLinkTypes.includes(link.label)
  );

  if (hasInvalidLabel) {
    return { error: 'settings.errors.invalidData' };
  }

  // Update profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: validation.data.fullName,
      role: validation.data.role,
      bio: validation.data.bio,
      social_links: validation.data.socialLinks,
      updated_at: new Date().toISOString(),
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
