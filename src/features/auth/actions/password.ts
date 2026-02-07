'use server';

import { getLocale } from 'next-intl/server';
import { z } from 'zod';

import { mapAuthError } from '@/features/auth/config';
import {
  AuthActionResult,
  forgotPasswordSchema,
  updatePasswordSchema,
} from '@/features/auth/types';
import { env } from '@/lib/common/env';
import { rateLimit } from '@/lib/common/rate-limit';
import { createClient } from '@/lib/supabase/server';

export const resetPassword = async (
  formData: z.infer<typeof forgotPasswordSchema>
): Promise<AuthActionResult> => {
  const { limited } = await rateLimit({ key: 'reset-password', limit: 3, windowSeconds: 3600 });

  if (limited) {
    return { error: 'auth.errors.rateLimitExceeded' };
  }

  const supabase = await createClient();
  const locale = await getLocale();
  const validation = forgotPasswordSchema.safeParse(formData);

  if (!validation.success) {
    return { error: 'auth.errors.invalidData' };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(validation.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/${locale}/auth/callback?next=/${locale}/update-password`,
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  return { success: true };
};

export const updatePassword = async (
  formData: z.infer<typeof updatePasswordSchema>
): Promise<AuthActionResult> => {
  const supabase = await createClient();
  const validation = updatePasswordSchema.safeParse(formData);

  if (!validation.success) {
    return { error: 'auth.errors.invalidData' };
  }

  const { error } = await supabase.auth.updateUser({
    password: validation.data.password,
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  return { success: true };
};
