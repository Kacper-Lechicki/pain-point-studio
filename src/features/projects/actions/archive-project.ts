'use server';

import { z } from 'zod';

import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { ProjectStatus } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

const archiveProjectSchema = z.object({
  projectId: z.uuid(),
});

export const archiveProject = withProtectedAction<typeof archiveProjectSchema>('archive-project', {
  schema: archiveProjectSchema,
  rateLimit: RATE_LIMITS.crud,
  action: async ({ data, user, supabase }) => {
    const { data: current } = await supabase
      .from('projects')
      .select('status')
      .eq('id', data.projectId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!current) {
      return { error: 'projects.errors.unexpected' };
    }

    const isArchived = isProjectArchived(current.status);

    const { data: row, error } = await supabase
      .from('projects')
      .update({
        status: (isArchived ? 'active' : 'archived') as ProjectStatus,
        archived_at: isArchived ? null : new Date().toISOString(),
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
});
