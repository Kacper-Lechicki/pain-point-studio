'use server';

import { getLocale } from 'next-intl/server';

import { getAuthCallbackUrl } from '@/features/auth/config/urls';
import { forgotPasswordSchema, updatePasswordSchema } from '@/features/auth/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withPublicAction } from '@/lib/common/with-public-action';
import { mapSupabaseError } from '@/lib/supabase/errors';

export const resetPassword = withPublicAction('reset-password', {
  schema: forgotPasswordSchema,
  rateLimit: RATE_LIMITS.sensitive,
  rateLimitError: 'auth.errors.rateLimitExceeded',
  validationError: 'auth.errors.invalidData',
  action: async ({ data, supabase }) => {
    const locale = await getLocale();

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: getAuthCallbackUrl(locale, '/update-password'),
    });

    if (error) {
      return { error: mapSupabaseError(error.message) };
    }

    return { success: true };
  },
});

export const updatePassword = withPublicAction('update-password', {
  schema: updatePasswordSchema,
  rateLimit: RATE_LIMITS.sensitiveRelaxed,
  rateLimitError: 'auth.errors.rateLimitExceeded',
  validationError: 'auth.errors.invalidData',
  action: async ({ data, supabase }) => {
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      return { error: mapSupabaseError(error.message) };
    }

    return { success: true };
  },
});
