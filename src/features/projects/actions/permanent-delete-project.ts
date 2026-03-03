'use server';

import { z } from 'zod';

import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

const permanentDeleteProjectSchema = z.object({
  projectId: z.uuid(),
});

export const permanentDeleteProject = withProtectedAction<typeof permanentDeleteProjectSchema>(
  'permanent-delete-project',
  {
    schema: permanentDeleteProjectSchema,
    rateLimit: RATE_LIMITS.crud,
    action: async ({ data, user, supabase }) => {
      // Only allow permanent delete from trashed status
      const { data: current } = await supabase
        .from('projects')
        .select('status')
        .eq('id', data.projectId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!current || current.status !== 'trashed') {
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
  }
);
