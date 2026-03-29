'use server';

import { z } from 'zod';

import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

/** Actions that can be handled by this generic status-change action. */
const STATUS_ACTIONS = ['complete', 'trash', 'restoreTrash'] as const;

const changeProjectStatusSchema = z.object({
  projectId: z.uuid(),
  action: z.enum(STATUS_ACTIONS),
});

export const changeProjectStatus = withProtectedAction<typeof changeProjectStatusSchema>(
  'change-project-status',
  {
    schema: changeProjectStatusSchema,
    rateLimit: RATE_LIMITS.crud,
    action: async ({ data, user, supabase }) => {
      const { data: result, error } = await supabase.rpc('change_project_status_with_cascade', {
        p_project_id: data.projectId,
        p_user_id: user.id,
        p_action: data.action,
      });

      if (error) {
        return { error: 'projects.errors.unexpected' };
      }

      const response = result as { error?: string; success?: boolean };

      if (response.error) {
        return { error: response.error };
      }

      return { success: true };
    },
  }
);
