'use server';

import { getLocale } from 'next-intl/server';

import { ROUTES } from '@/config';
import { updateEmailSchema } from '@/features/settings/types';
import { env } from '@/lib/common/env';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';
import { mapAuthError } from '@/lib/providers/server';

export const updateEmail = withProtectedAction('update-email', {
  schema: updateEmailSchema,
  rateLimit: RATE_LIMITS.sensitive,
  action: async ({ data, auth }) => {
    const locale = await getLocale();

    const { error } = await auth.updateUser(
      { email: data.email },
      `${env.NEXT_PUBLIC_APP_URL}/${locale}/auth/callback?next=/${locale}${ROUTES.common.settings}&type=email_change`
    );

    if (error) {
      return { error: mapAuthError(error.message) };
    }

    return { success: true };
  },
});
