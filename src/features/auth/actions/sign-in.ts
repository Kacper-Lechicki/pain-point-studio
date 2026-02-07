'use server';

import { redirect } from 'next/navigation';

import { getLocale } from 'next-intl/server';
import { z } from 'zod';

import { mapAuthError } from '@/features/auth/config';
import { AuthActionResult, AuthProvider, signInSchema } from '@/features/auth/types';
import { env } from '@/lib/common/env';
import { rateLimit } from '@/lib/common/rate-limit';
import { createClient } from '@/lib/supabase/server';

export const signInWithEmail = async (
  formData: z.infer<typeof signInSchema>
): Promise<AuthActionResult> => {
  const { limited } = await rateLimit({ key: 'sign-in', limit: 5, windowSeconds: 300 });

  if (limited) {
    return { error: 'auth.errors.rateLimitExceeded' };
  }

  const supabase = await createClient();
  const validation = signInSchema.safeParse(formData);

  if (!validation.success) {
    return { error: 'auth.errors.invalidData' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: validation.data.email,
    password: validation.data.password,
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  return { success: true };
};

export const signInWithOAuth = async (provider: AuthProvider): Promise<{ error: string }> => {
  const supabase = await createClient();
  const locale = await getLocale();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/${locale}/auth/callback`,
    },
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: 'auth.errors.unexpected' };
};
