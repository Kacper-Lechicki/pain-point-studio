'use server';

import { mapAuthError } from '@/features/auth/config';
import { UpdateEmailSchema, updateEmailSchema } from '@/features/settings/types';
import { rateLimit } from '@/lib/common/rate-limit';
import { ActionResult } from '@/lib/common/types';
import { createClient } from '@/lib/supabase/server';

export const updateEmail = async (formData: UpdateEmailSchema): Promise<ActionResult> => {
  const { limited } = await rateLimit({ key: 'update-email', limit: 3, windowSeconds: 3600 });

  if (limited) {
    return { error: 'settings.errors.rateLimitExceeded' };
  }

  const validation = updateEmailSchema.safeParse(formData);

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

  const { error } = await supabase.auth.updateUser({
    email: validation.data.email,
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  return { success: true };
};
