'use server';

import { updateNoteFolderSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const updateNoteFolder = withProtectedAction<typeof updateNoteFolderSchema>(
  'update-note-folder',
  {
    schema: updateNoteFolderSchema,
    rateLimit: RATE_LIMITS.crud,
    action: async ({ data, user, supabase }) => {
      const { data: row, error } = await supabase
        .from('project_note_folders')
        .update({ name: data.name })
        .eq('id', data.folderId)
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
