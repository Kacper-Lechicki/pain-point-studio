'use server';

import { getLocale } from 'next-intl/server';

import { ROUTES } from '@/config';
import { updateEmailSchema } from '@/features/settings/types';
import { env } from '@/lib/common/env';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';
import { mapSupabaseError } from '@/lib/supabase/errors';

export const updateEmail = withProtectedAction('update-email', {
  schema: updateEmailSchema,
  rateLimit: RATE_LIMITS.sensitive,
  action: async ({ data, supabase }) => {
    const locale = await getLocale();

    const { error } = await supabase.auth.updateUser(
      { email: data.email },
      {
        emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/${locale}/auth/callback?next=/${locale}${ROUTES.common.settings}&type=email_change`,
      }
    );

    if (error) {
      return { error: mapSupabaseError(error.message) };
    }

    return { success: true };
  },
});
