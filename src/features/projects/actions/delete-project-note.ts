'use server';

import { deleteProjectNoteSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

/** Soft-delete a note (move to trash). */
export const deleteProjectNote = withProtectedAction<typeof deleteProjectNoteSchema>(
  'delete-project-note',
  {
    schema: deleteProjectNoteSchema,
    rateLimit: RATE_LIMITS.crud,
    action: async ({ data, user, supabase }) => {
      const { data: row, error } = await supabase
        .from('project_notes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', data.noteId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .select('id')
        .maybeSingle();

      if (error || !row) {
        return { error: 'projects.errors.unexpected' };
      }

      return { success: true };
    },
  }
);
