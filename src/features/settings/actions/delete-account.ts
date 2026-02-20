'use server';

import { deleteAccountSchema } from '@/features/settings/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';
import { createAdminClient } from '@/lib/supabase/admin';

export const deleteAccount = withProtectedAction('delete-account', {
  schema: deleteAccountSchema,
  rateLimit: RATE_LIMITS.destructive,
  validationError: 'settings.errors.confirmationMismatch',
  action: async ({ data, user, supabase }) => {
    if (data.confirmation !== user.email) {
      return { error: 'settings.errors.confirmationMismatch' };
    }

    const { data: avatarFiles } = await supabase.storage.from('avatars').list(user.id);

    if (avatarFiles && avatarFiles.length > 0) {
      const filePaths = avatarFiles.map((file) => `${user.id}/${file.name}`);

      await supabase.storage.from('avatars').remove(filePaths);
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);

    if (error) {
      return { error: 'settings.errors.deleteFailed' };
    }

    await supabase.auth.signOut();

    return { success: true };
  },
});
