'use server';

import { redirect } from 'next/navigation';

import { getLocale } from 'next-intl/server';
import { z } from 'zod';

import { AuthActionResult, AuthProvider, signInSchema } from '@/features/auth/types';
import { env } from '@/lib/common/env';
import { createClient } from '@/lib/supabase/server';

export const signInWithEmail = async (
  formData: z.infer<typeof signInSchema>
): Promise<AuthActionResult> => {
  const supabase = await createClient();
  const validation = signInSchema.safeParse(formData);

  if (!validation.success) {
    return { error: 'Invalid data' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: validation.data.email,
    password: validation.data.password,
  });

  if (error) {
    return { error: error.message };
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
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: 'No redirect URL returned' };
};
