'use server';

import { getLocale } from 'next-intl/server';

import { signUpSchema } from '@/features/auth/types';
import { env } from '@/lib/common/env';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withPublicAction } from '@/lib/common/with-public-action';
import { createServerAuth, mapAuthError } from '@/lib/providers/server';

export const signUpWithEmail = withPublicAction('sign-up', {
  schema: signUpSchema,
  rateLimit: RATE_LIMITS.authStrict,
  rateLimitError: 'auth.errors.rateLimitExceeded',
  validationError: 'auth.errors.invalidData',
  action: async ({ data }) => {
    const auth = await createServerAuth();
    const locale = await getLocale();

    const { error } = await auth.signUp({
      email: data.email,
      password: data.password,
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/${locale}/auth/callback`,
    });

    if (error) {
      return { error: mapAuthError(error.message) };
    }

    return { success: true };
  },
});
