'use server';

import { getLocale } from 'next-intl/server';

import { forgotPasswordSchema, updatePasswordSchema } from '@/features/auth/types';
import { env } from '@/lib/common/env';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withPublicAction } from '@/lib/common/with-public-action';
import { mapSupabaseError } from '@/lib/supabase/errors';

/** Sends a password-reset email with a locale-aware callback URL. */
export const resetPassword = withPublicAction('reset-password', {
  schema: forgotPasswordSchema,
  rateLimit: RATE_LIMITS.sensitive,
  rateLimitError: 'auth.errors.rateLimitExceeded',
  validationError: 'auth.errors.invalidData',
  action: async ({ data, supabase }) => {
    const locale = await getLocale();

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/${locale}/auth/callback?next=/${locale}/update-password`,
    });

    if (error) {
      return { error: mapSupabaseError(error.message) };
    }

    return { success: true };
  },
});

/** Sets a new password for the authenticated user (called after reset-link redirect). */
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
