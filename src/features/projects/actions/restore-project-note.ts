'use server';

import { restoreProjectNoteSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

/** Restore a note from trash. */
export const restoreProjectNote = withProtectedAction<typeof restoreProjectNoteSchema>(
  'restore-project-note',
  {
    schema: restoreProjectNoteSchema,
    rateLimit: RATE_LIMITS.crud,
    action: async ({ data, user, supabase }) => {
      const { data: row, error } = await supabase
        .from('project_notes')
        .update({ deleted_at: null })
        .eq('id', data.noteId)
        .eq('user_id', user.id)
        .not('deleted_at', 'is', null)
        .select('id')
        .maybeSingle();

      if (error || !row) {
        return { error: 'projects.errors.unexpected' };
      }

      return { success: true };
    },
  }
);
