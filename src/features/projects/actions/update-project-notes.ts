'use server';

import { updateProjectNotesSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const updateProjectNotes = withProtectedAction<typeof updateProjectNotesSchema>(
  'update-project-notes',
  {
    schema: updateProjectNotesSchema,
    rateLimit: RATE_LIMITS.frequentSave,
    action: async ({ data, user, supabase }) => {
      const { data: row, error } = await supabase
        .from('projects')
        .update({
          notes: data.notes || null,
        })
        .eq('id', data.projectId)
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
