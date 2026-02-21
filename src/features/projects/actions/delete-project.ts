'use server';

import { z } from 'zod';

import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

const deleteProjectSchema = z.object({
  projectId: z.uuid(),
});

export const deleteProject = withProtectedAction<typeof deleteProjectSchema>('delete-project', {
  schema: deleteProjectSchema,
  rateLimit: RATE_LIMITS.crud,
  action: async ({ data, user, supabase }) => {
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
