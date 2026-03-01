'use server';

import { moveNoteToFolderSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const moveNoteToFolder = withProtectedAction<typeof moveNoteToFolderSchema>(
  'move-note-to-folder',
  {
    schema: moveNoteToFolderSchema,
    rateLimit: RATE_LIMITS.crud,
    action: async ({ data, user, supabase }) => {
      const { data: row, error } = await supabase
        .from('project_notes')
        .update({ folder_id: data.folderId })
        .eq('id', data.noteId)
        .eq('user_id', user.id)
        .select('id')
        .maybeSingle();

      if (error || !row) {
        return { error: 'projects.errors.unexpected' };
      }

      return { success: true };
    },
  }
);
