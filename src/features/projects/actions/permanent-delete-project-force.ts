'use server';

import { permanentDeleteProjectForceSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const permanentDeleteProjectForce = withProtectedAction<
  typeof permanentDeleteProjectForceSchema
>('permanent-delete-project-force', {
  schema: permanentDeleteProjectForceSchema,
  rateLimit: RATE_LIMITS.crud,
  action: async ({ data, user, supabase }) => {
    const { data: current } = await supabase
      .from('projects')
      .select('name')
      .eq('id', data.projectId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!current) {
      return { error: 'projects.errors.unexpected' };
    }

    if (data.confirmation !== current.name) {
      return { error: 'projects.errors.unexpected' };
    }

    const { data: row, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', data.projectId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (error || !row) {
      return { error: 'projects.errors.unexpected' };
    }

    return { success: true };
  },
});
