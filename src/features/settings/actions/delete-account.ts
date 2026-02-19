'use server';

import { deleteAccountSchema } from '@/features/settings/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';
import { createAuthAdmin } from '@/lib/providers/server';

export const deleteAccount = withProtectedAction('delete-account', {
  schema: deleteAccountSchema,
  rateLimit: RATE_LIMITS.destructive,
  validationError: 'settings.errors.confirmationMismatch',
  action: async ({ data, user, auth, storage }) => {
    if (data.confirmation !== user.email) {
      return { error: 'settings.errors.confirmationMismatch' };
    }

    const { data: avatarFiles } = await storage.list('avatars', user.id);

    if (avatarFiles && avatarFiles.length > 0) {
      const filePaths = avatarFiles.map((file) => `${user.id}/${file.name}`);

      await storage.remove('avatars', filePaths);
    }

    const authAdmin = createAuthAdmin();

    const { error } = await authAdmin.deleteUser(user.id);

    if (error) {
      return { error: 'settings.errors.deleteFailed' };
    }

    await auth.signOut();

    return { success: true };
  },
});
