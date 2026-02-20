'use server';

import { redirect } from 'next/navigation';

import { getLocale } from 'next-intl/server';

import { AuthProvider, signInSchema } from '@/features/auth/types';
import { env } from '@/lib/common/env';
import { rateLimit } from '@/lib/common/rate-limit';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withPublicAction } from '@/lib/common/with-public-action';
import { mapSupabaseError } from '@/lib/supabase/errors';
import { createClient } from '@/lib/supabase/server';

export const signInWithEmail = withPublicAction('sign-in', {
  schema: signInSchema,
  rateLimit: RATE_LIMITS.auth,
  rateLimitError: 'auth.errors.rateLimitExceeded',
  validationError: 'auth.errors.invalidData',
  action: async ({ data, supabase }) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return { error: mapSupabaseError(error.message) };
    }

    return { success: true };
  },
});

export const signInWithOAuth = async (provider: AuthProvider): Promise<{ error: string }> => {
  const { limited } = await rateLimit({ key: 'sign-in-oauth', ...RATE_LIMITS.auth });

  if (limited) {
    return { error: 'auth.errors.rateLimitExceeded' };
  }

  const supabase = await createClient();
  const locale = await getLocale();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${env.NEXT_PUBLIC_APP_URL}/${locale}/auth/callback` },
  });

  if (error) {
    return { error: mapSupabaseError(error.message) };
  }

  if (data?.url) {
    redirect(data.url);
  }

  return { error: 'auth.errors.unexpected' };
};
