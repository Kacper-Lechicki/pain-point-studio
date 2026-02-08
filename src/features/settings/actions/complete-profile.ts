'use server';

import { mapAuthError } from '@/features/auth/config';
import { CompleteProfileSchema, completeProfileSchema } from '@/features/settings/types';
import { rateLimit } from '@/lib/common/rate-limit';
import { ActionResult } from '@/lib/common/types';
import { createClient } from '@/lib/supabase/server';

export const completeProfile = async (formData: CompleteProfileSchema): Promise<ActionResult> => {
  const { limited } = await rateLimit({ key: 'complete-profile', limit: 5, windowSeconds: 300 });

  if (limited) {
    return { error: 'settings.errors.rateLimitExceeded' };
  }

  const validation = completeProfileSchema.safeParse(formData);

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
      full_name: validation.data.fullName,
      role: validation.data.role,
    })
    .eq('id', user.id);

  if (profileError) {
    return { error: mapAuthError(profileError.message) };
  }

  const { error: metaError } = await supabase.auth.updateUser({
    data: { full_name: validation.data.fullName },
  });

  if (metaError) {
    return { error: mapAuthError(metaError.message) };
  }

  return { success: true };
};
