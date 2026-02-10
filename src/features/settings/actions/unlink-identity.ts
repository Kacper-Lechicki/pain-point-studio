'use server';

import { unlinkIdentitySchema } from '@/features/settings/types';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const unlinkIdentity = withProtectedAction('unlink-identity', {
  schema: unlinkIdentitySchema,
  rateLimit: { limit: 5, windowSeconds: 3600 },
  action: async ({ data, user, supabase }) => {
    const identities = user.identities ?? [];
    const oauthIdentities = identities.filter((i) => i.provider !== 'email');
    const { data: hasPassword } = await supabase.rpc('has_password');
    const totalLoginMethods = oauthIdentities.length + (hasPassword ? 1 : 0);

    if (totalLoginMethods < 2) {
      return { error: 'settings.connectedAccounts.errors.cannotUnlinkLast' };
    }

    const identityToUnlink = identities.find(
      (i) => i.identity_id === data.identityId && i.provider === data.provider
    );

    if (!identityToUnlink) {
      return { error: 'settings.connectedAccounts.errors.identityNotFound' };
    }

    const { error } = await supabase.auth.unlinkIdentity(identityToUnlink);

    if (error) {
      return { error: 'settings.connectedAccounts.errors.unlinkFailed' };
    }

    return { success: true };
  },
});
