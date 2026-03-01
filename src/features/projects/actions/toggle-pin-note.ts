'use server';

import { togglePinProjectNoteSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const togglePinProjectNote = withProtectedAction<typeof togglePinProjectNoteSchema>(
  'toggle-pin-project-note',
  {
    schema: togglePinProjectNoteSchema,
    rateLimit: RATE_LIMITS.crud,
    action: async ({ data, user, supabase }) => {
      const { data: row, error } = await supabase
        .from('project_notes')
        .update({ is_pinned: data.isPinned })
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
