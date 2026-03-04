'use server';

import { NOTE_TITLE_MAX_LENGTH } from '@/features/projects/config';
import { duplicateProjectNoteSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const duplicateProjectNote = withProtectedAction<
  typeof duplicateProjectNoteSchema,
  { noteId: string }
>('duplicate-project-note', {
  schema: duplicateProjectNoteSchema,
  rateLimit: RATE_LIMITS.crud,
  action: async ({ data, user, supabase }) => {
    // Fetch the original note
    const { data: original, error: fetchError } = await supabase
      .from('project_notes')
      .select('*')
      .eq('id', data.noteId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (fetchError || !original) {
      return { error: 'projects.errors.unexpected' };
    }

    const copyTitle = `Copy of ${original.title}`.slice(0, NOTE_TITLE_MAX_LENGTH);

    const { data: copy, error: insertError } = await supabase
      .from('project_notes')
      .insert({
        project_id: original.project_id,
        user_id: user.id,
        folder_id: original.folder_id,
        title: copyTitle,
        content_json: original.content_json,
        is_pinned: false,
      })
      .select('id')
      .single();

    if (insertError || !copy) {
      return { error: 'projects.errors.unexpected' };
    }

    return { success: true, data: { noteId: copy.id } };
  },
});
