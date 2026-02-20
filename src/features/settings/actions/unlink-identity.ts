'use server';

import { unlinkIdentitySchema } from '@/features/settings/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const unlinkIdentity = withProtectedAction('unlink-identity', {
  schema: unlinkIdentitySchema,
  rateLimit: RATE_LIMITS.sensitiveRelaxed,
  action: async ({ data, user, supabase }) => {
    const identities = user.identities;
    const oauthIdentities = identities.filter((i) => i.provider !== 'email');
    const { data: hasPassword } = await supabase.rpc('has_password');
    const totalLoginMethods = oauthIdentities.length + (hasPassword ? 1 : 0);

    if (totalLoginMethods < 2) {
      return { error: 'settings.connectedAccounts.errors.cannotUnlinkLast' };
    }

    const identityToUnlink = identities.find(
      (i) => i.identityId === data.identityId && i.provider === data.provider
    );

    if (!identityToUnlink) {
      return { error: 'settings.connectedAccounts.errors.identityNotFound' };
    }

    // Map AppIdentity back to the shape Supabase expects
    const {
      data: { user: freshUser },
    } = await supabase.auth.getUser();
    const supabaseIdentity = freshUser?.identities?.find(
      (i) =>
        i.identity_id === identityToUnlink.identityId && i.provider === identityToUnlink.provider
    );

    if (!supabaseIdentity) {
      return { error: 'settings.connectedAccounts.errors.identityNotFound' };
    }

    const { error } = await supabase.auth.unlinkIdentity(supabaseIdentity);

    if (error) {
      return { error: 'settings.connectedAccounts.errors.unlinkFailed' };
    }

    return { success: true };
  },
});
