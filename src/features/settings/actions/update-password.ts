'use server';

import { mapAuthError } from '@/features/auth/config';
import { ChangePasswordSchema, changePasswordSchema } from '@/features/settings/types';
import { rateLimit } from '@/lib/common/rate-limit';
import { ActionResult } from '@/lib/common/types';
import { createClient } from '@/lib/supabase/server';

export const changePassword = async (formData: ChangePasswordSchema): Promise<ActionResult> => {
  const { limited } = await rateLimit({ key: 'change-password', limit: 3, windowSeconds: 3600 });

  if (limited) {
    return { error: 'settings.errors.rateLimitExceeded' };
  }

  const validation = changePasswordSchema.safeParse(formData);

  if (!validation.success) {
    return { error: 'settings.errors.invalidData' };
  }

  const supabase = await createClient();

  // If current password is provided, verify it first
  if (validation.data.currentPassword) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return { error: 'settings.errors.unexpected' };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: validation.data.currentPassword,
    });

    if (signInError) {
      return { error: 'settings.errors.currentPasswordIncorrect' };
    }
  }

  const { error } = await supabase.auth.updateUser({
    password: validation.data.password,
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  return { success: true };
};
