'use server';

import { reorderProjectNotesSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const reorderProjectNotes = withProtectedAction<typeof reorderProjectNotesSchema>(
  'reorder-project-notes',
  {
    schema: reorderProjectNotesSchema,
    rateLimit: RATE_LIMITS.frequentSave,
    action: async ({ data, user, supabase }) => {
      // Bulk update sort_order based on array index
      const updates = data.noteIds.map((noteId, index) =>
        supabase
          .from('project_notes')
          .update({ sort_order: index })
          .eq('id', noteId)
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
