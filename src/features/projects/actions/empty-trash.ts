'use server';

import { emptyTrashSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

/** Permanently delete all trashed notes for a project. */
export const emptyTrash = withProtectedAction<typeof emptyTrashSchema>('empty-trash', {
  schema: emptyTrashSchema,
  rateLimit: RATE_LIMITS.crud,
  action: async ({ data, user, supabase }) => {
    const { error } = await supabase
      .from('project_notes')
      .delete()
      .eq('project_id', data.projectId)
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null);

    if (error) {
      return { error: 'projects.errors.unexpected' };
    }

    return { success: true };
  },
});
