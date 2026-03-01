'use server';

import { reorderNoteFoldersSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const reorderNoteFolders = withProtectedAction<typeof reorderNoteFoldersSchema>(
  'reorder-note-folders',
  {
    schema: reorderNoteFoldersSchema,
    rateLimit: RATE_LIMITS.frequentSave,
    action: async ({ data, user, supabase }) => {
      const updates = data.folderIds.map((folderId, index) =>
        supabase
          .from('project_note_folders')
          .update({ sort_order: index })
          .eq('id', folderId)
          .eq('user_id', user.id)
      );

      const results = await Promise.all(updates);
      const hasError = results.some((r) => r.error);

      if (hasError) {
        return { error: 'projects.errors.unexpected' };
      }

      return { success: true };
    },
  }
);
