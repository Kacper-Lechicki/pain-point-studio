'use server';

import { z } from 'zod';

import { type ProjectAction, canTransition } from '@/features/projects/config/status';
import type { ProjectStatus } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

const STATUS_ACTIONS = ['complete', 'trash', 'restoreTrash', 'permanentDelete'] as const;

const bulkChangeProjectStatusSchema = z.object({
  projectIds: z.array(z.uuid()).min(1).max(50),
  action: z.enum(STATUS_ACTIONS),
});

interface BulkResult {
  total: number;
  failed: number;
  failedIds: string[];
}

export const bulkChangeProjectStatus = withProtectedAction<
  typeof bulkChangeProjectStatusSchema,
  BulkResult
>('bulk-change-project-status', {
  schema: bulkChangeProjectStatusSchema,
  rateLimit: RATE_LIMITS.crud,
  action: async ({ data, user, supabase }) => {
    // Pre-fetch all projects in one query (matches survey bulk pattern)
    const { data: projects } = await supabase
      .from('projects')
      .select('id, status')
      .in('id', data.projectIds)
      .eq('user_id', user.id);

    if (!projects || projects.length === 0) {
      return {
        error: 'projects.errors.bulkAllFailed',
        data: {
          total: data.projectIds.length,
          failed: data.projectIds.length,
          failedIds: data.projectIds,
        },
      };
    }

    const total = data.projectIds.length;
    let successCount = 0;
    const failedIds: string[] = [];

    for (const project of projects) {
      // Pre-validate transition before calling RPC
      if (!canTransition(project.status as ProjectStatus, data.action as ProjectAction)) {
        failedIds.push(project.id);
        continue;
      }

      const { data: result, error } = await supabase.rpc('change_project_status_with_cascade', {
        p_project_id: project.id,
        p_user_id: user.id,
        p_action: data.action,
      });

      if (error) {
        failedIds.push(project.id);
        continue;
      }

      const response = result as { error?: string; success?: boolean };

      if (response.success) {
        successCount++;
      } else {
        failedIds.push(project.id);
      }
    }

    // Count projects that weren't found (not owned by user or don't exist)
    const notFoundIds = data.projectIds.filter((id) => !projects.some((p) => p.id === id));
    failedIds.push(...notFoundIds);

    const failed = total - successCount;

    if (successCount === 0) {
      return { error: 'projects.errors.bulkAllFailed', data: { total, failed, failedIds } };
    }

    return { success: true, data: { total, failed, failedIds } };
  },
});
