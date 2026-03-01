'use server';

import { deleteNoteFolderSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

/** Delete a folder. Notes in it become unfiled (folder FK is ON DELETE SET NULL). */
export const deleteNoteFolder = withProtectedAction<typeof deleteNoteFolderSchema>(
  'delete-note-folder',
  {
    schema: deleteNoteFolderSchema,
    rateLimit: RATE_LIMITS.crud,
    action: async ({ data, user, supabase }) => {
      const { error } = await supabase
        .from('project_note_folders')
        .delete()
        .eq('id', data.folderId)
        .eq('user_id', user.id);

      if (error) {
        return { error: 'projects.errors.unexpected' };
      }

      return { success: true };
    },
  }
);
