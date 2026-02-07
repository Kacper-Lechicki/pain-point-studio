'use server';

import { getLocale } from 'next-intl/server';
import { z } from 'zod';

import { mapAuthError } from '@/features/auth/config';
import { AuthActionResult, signUpSchema } from '@/features/auth/types';
import { env } from '@/lib/common/env';
import { rateLimit } from '@/lib/common/rate-limit';
import { createClient } from '@/lib/supabase/server';

export const signUpWithEmail = async (
  formData: z.infer<typeof signUpSchema>
): Promise<AuthActionResult> => {
  const { limited } = await rateLimit({ key: 'sign-up', limit: 3, windowSeconds: 300 });

  if (limited) {
    return { error: 'auth.errors.rateLimitExceeded' };
  }

  const supabase = await createClient();
  const locale = await getLocale();
  const validation = signUpSchema.safeParse(formData);

  if (!validation.success) {
    return { error: 'Invalid data' };
  }

  const { error } = await supabase.auth.signUp({
    email: validation.data.email,
    password: validation.data.password,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/${locale}/auth/callback`,
    },
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  return { success: true };
};
