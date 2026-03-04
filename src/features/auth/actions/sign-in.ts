'use server';

import { redirect } from 'next/navigation';

import { getLocale } from 'next-intl/server';

import { getAuthCallbackUrl } from '@/features/auth/config/urls';
import { authProviderSchema, signInSchema } from '@/features/auth/types';
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

export const signInWithOAuth = async (provider: string): Promise<{ error: string }> => {
  const parsed = authProviderSchema.safeParse(provider);

  if (!parsed.success) {
    return { error: 'auth.errors.invalidData' };
  }

  const { limited } = await rateLimit({ key: 'sign-in-oauth', ...RATE_LIMITS.auth });

  if (limited) {
    return { error: 'auth.errors.rateLimitExceeded' };
  }

  let redirectUrl: string | null = null;

  try {
    const supabase = await createClient();
    const locale = await getLocale();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: parsed.data,
      options: { redirectTo: getAuthCallbackUrl(locale) },
    });

    if (error) {
      return { error: mapSupabaseError(error.message) };
    }

    redirectUrl = data?.url ?? null;
  } catch {
    return { error: 'auth.errors.unexpected' };
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  return { error: 'auth.errors.unexpected' };
};
