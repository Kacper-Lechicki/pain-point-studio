'use server';

import { permanentlyDeleteProjectNoteSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

/** Permanently delete a trashed note. */
export const permanentlyDeleteProjectNote = withProtectedAction<
  typeof permanentlyDeleteProjectNoteSchema
>('permanently-delete-project-note', {
  schema: permanentlyDeleteProjectNoteSchema,
  rateLimit: RATE_LIMITS.crud,
  action: async ({ data, user, supabase }) => {
    // Only allow permanent deletion of already-trashed notes
    const { error } = await supabase
      .from('project_notes')
      .delete()
      .eq('id', data.noteId)
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null);

    if (error) {
      return { error: 'projects.errors.unexpected' };
    }

    return { success: true };
  },
});
