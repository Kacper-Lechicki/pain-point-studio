'use server';

import { getLocale } from 'next-intl/server';

import { forgotPasswordSchema, updatePasswordSchema } from '@/features/auth/types';
import { env } from '@/lib/common/env';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withPublicAction } from '@/lib/common/with-public-action';
import { createServerAuth, mapAuthError } from '@/lib/providers/server';

export const resetPassword = withPublicAction('reset-password', {
  schema: forgotPasswordSchema,
  rateLimit: RATE_LIMITS.sensitive,
  rateLimitError: 'auth.errors.rateLimitExceeded',
  validationError: 'auth.errors.invalidData',
  action: async ({ data }) => {
    const auth = await createServerAuth();
    const locale = await getLocale();

    const { error } = await auth.resetPasswordForEmail(data.email, {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/${locale}/auth/callback?next=/${locale}/update-password`,
    });

    if (error) {
      return { error: mapAuthError(error.message) };
    }

    return { success: true };
  },
});

export const updatePassword = withPublicAction('update-password', {
  schema: updatePasswordSchema,
  rateLimit: RATE_LIMITS.sensitiveRelaxed,
  rateLimitError: 'auth.errors.rateLimitExceeded',
  validationError: 'auth.errors.invalidData',
  action: async ({ data }) => {
    const auth = await createServerAuth();

    const { error } = await auth.updateUser({
      password: data.password,
    });

    if (error) {
      return { error: mapAuthError(error.message) };
    }

    return { success: true };
  },
});
