'use server';

import { getLocale } from 'next-intl/server';

import { signUpSchema } from '@/features/auth/types';
import { env } from '@/lib/common/env';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withPublicAction } from '@/lib/common/with-public-action';
import { mapSupabaseError } from '@/lib/supabase/errors';

export const signUpWithEmail = withPublicAction('sign-up', {
  schema: signUpSchema,
  rateLimit: RATE_LIMITS.authStrict,
  rateLimitError: 'auth.errors.rateLimitExceeded',
  validationError: 'auth.errors.invalidData',
  action: async ({ data, supabase }) => {
    const locale = await getLocale();

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/${locale}/auth/callback`,
      },
    });

    if (error) {
      return { error: mapSupabaseError(error.message) };
    }

    return { success: true };
  },
});
