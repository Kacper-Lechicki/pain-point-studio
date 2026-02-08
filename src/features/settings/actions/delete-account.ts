'use server';

import { DeleteAccountSchema, deleteAccountSchema } from '@/features/settings/types';
import { rateLimit } from '@/lib/common/rate-limit';
import { ActionResult } from '@/lib/common/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const deleteAccount = async (formData: DeleteAccountSchema): Promise<ActionResult> => {
  const { limited } = await rateLimit({ key: 'delete-account', limit: 1, windowSeconds: 3600 });

  if (limited) {
    return { error: 'settings.errors.rateLimitExceeded' };
  }

  const validation = deleteAccountSchema.safeParse(formData);

  if (!validation.success) {
    return { error: 'settings.errors.confirmationMismatch' };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'settings.errors.unexpected' };
  }

  // Confirmation must match user's email
  if (validation.data.confirmation !== user.email) {
    return { error: 'settings.errors.confirmationMismatch' };
  }

  // Clean up avatar files from storage
  const { data: avatarFiles } = await supabase.storage.from('avatars').list(user.id);

  if (avatarFiles && avatarFiles.length > 0) {
    const filePaths = avatarFiles.map((file) => `${user.id}/${file.name}`);

    await supabase.storage.from('avatars').remove(filePaths);
  }

  // Delete user via admin client (cascade deletes profile row)
  const adminClient = createAdminClient();

  const { error } = await adminClient.auth.admin.deleteUser(user.id);

  if (error) {
    return { error: 'settings.errors.deleteFailed' };
  }

  // Sign out current session
  await supabase.auth.signOut();

  return { success: true };
};
