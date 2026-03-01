'use server';

import { extractTitleFromTiptap } from '@/features/projects/lib/note-helpers';
import { updateProjectNoteSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const updateProjectNote = withProtectedAction<typeof updateProjectNoteSchema>(
  'update-project-note',
  {
    schema: updateProjectNoteSchema,
    rateLimit: RATE_LIMITS.frequentSave,
    action: async ({ data, user, supabase }) => {
      const title = extractTitleFromTiptap(data.content);

      const { data: row, error } = await supabase
        .from('project_notes')
        .update({
          content_json: data.content ?? null,
          title,
        })
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
