'use server';

import { getLocale } from 'next-intl/server';
import { z } from 'zod';

import { AuthActionResult, signUpSchema } from '@/features/auth/types';
import { env } from '@/lib/common/env';
import { createClient } from '@/lib/supabase/server';

export const signUpWithEmail = async (
  formData: z.infer<typeof signUpSchema>
): Promise<AuthActionResult> => {
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
    return { error: error.message };
  }

  return { success: true };
};
