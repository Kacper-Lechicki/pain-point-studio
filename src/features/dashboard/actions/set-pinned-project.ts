'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

const setPinnedProjectSchema = z.object({
  projectId: z.string().uuid().nullable(),
});

/**
 * Pin or unpin a project on the dashboard.
 * Pass `{ projectId: null }` to unpin the currently pinned project.
 */
export const setPinnedProject = withProtectedAction('set-pinned-project', {
  schema: setPinnedProjectSchema,
  rateLimit: RATE_LIMITS.crud,
  action: async ({ data, user, supabase }) => {
    const { error } = await supabase
      .from('profiles')
      .update({ pinned_project_id: data.projectId })
      .eq('id', user.id);

    if (error) {
      return { error: 'common.errors.unexpected' };
    }

    revalidatePath('/dashboard');

    return { success: true };
  },
});
