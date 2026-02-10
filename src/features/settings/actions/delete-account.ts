'use server';

import { deleteAccountSchema } from '@/features/settings/types';
import { withProtectedAction } from '@/lib/common/with-protected-action';
import { createAdminClient } from '@/lib/supabase/admin';

export const deleteAccount = withProtectedAction('delete-account', {
  schema: deleteAccountSchema,
  rateLimit: { limit: 1, windowSeconds: 3600 },
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

    const adminClient = createAdminClient();

    const { error } = await adminClient.auth.admin.deleteUser(user.id);

    if (error) {
      return { error: 'settings.errors.deleteFailed' };
    }

    await supabase.auth.signOut();

    return { success: true };
  },
});
