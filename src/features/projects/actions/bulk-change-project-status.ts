'use server';

import { z } from 'zod';

import { type ProjectAction, canTransition } from '@/features/projects/config/status';
import type { ProjectStatus } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

const STATUS_ACTIONS = [
  'complete',
  'archive',
  'reopen',
  'restore',
  'trash',
  'restoreTrash',
] as const;

const bulkChangeProjectStatusSchema = z.object({
  projectIds: z.array(z.uuid()).min(1).max(50),
  action: z.enum(STATUS_ACTIONS),
});

function buildUpdatePayload(
  action: (typeof STATUS_ACTIONS)[number],
  currentStatus: string,
  preTrashStatus: string | null,
  preArchiveStatus: string | null
): Record<string, unknown> {
  const now = new Date().toISOString();

  switch (action) {
    case 'complete':
      return { status: 'completed', completed_at: now };
    case 'archive':
      return { status: 'archived', archived_at: now, pre_archive_status: currentStatus };
    case 'reopen':
      return { status: 'active', completed_at: null };
    case 'restore':
      return { status: preArchiveStatus || 'active', archived_at: null, pre_archive_status: null };
    case 'trash':
      return { status: 'trashed', deleted_at: now, pre_trash_status: currentStatus };
    case 'restoreTrash':
      return {
        status: preTrashStatus || 'active',
        deleted_at: null,
        pre_trash_status: null,
      };
  }
}

export const bulkChangeProjectStatus = withProtectedAction<typeof bulkChangeProjectStatusSchema>(
  'bulk-change-project-status',
  {
    schema: bulkChangeProjectStatusSchema,
    rateLimit: RATE_LIMITS.crud,
    action: async ({ data, user, supabase }) => {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, status, pre_trash_status, pre_archive_status')
        .in('id', data.projectIds)
        .eq('user_id', user.id);

      if (!projects || projects.length === 0) {
        return { error: 'projects.errors.unexpected' };
      }

      let successCount = 0;

      for (const project of projects) {
        if (!canTransition(project.status as ProjectStatus, data.action as ProjectAction)) {
          continue;
        }

        const updatePayload = buildUpdatePayload(
          data.action,
          project.status,
          project.pre_trash_status,
          project.pre_archive_status
        );

        const { error } = await supabase
          .from('projects')
          .update(updatePayload)
          .eq('id', project.id)
          .eq('user_id', user.id);

        if (!error) {
          successCount++;

          // ── Cascade to surveys ────────────────────────────────────
          const now = new Date().toISOString();

          if (data.action === 'trash') {
            const { data: surveys } = await supabase
              .from('surveys')
              .select('id, status')
              .eq('project_id', project.id)
              .neq('status', 'trashed');

            if (surveys) {
              for (const survey of surveys) {
                await supabase
                  .from('surveys')
                  .update({
                    status: 'trashed',
                    deleted_at: now,
                    pre_trash_status: survey.status,
                  })
                  .eq('id', survey.id);
              }
            }
          } else if (data.action === 'restoreTrash') {
            const { data: surveys } = await supabase
              .from('surveys')
              .select('id, pre_trash_status')
              .eq('project_id', project.id)
              .eq('status', 'trashed');

            if (surveys) {
              for (const survey of surveys) {
                const restorePayload: Record<string, unknown> = {
                  status: survey.pre_trash_status || 'draft',
                  deleted_at: null,
                  pre_trash_status: null,
                };
                await supabase.from('surveys').update(restorePayload).eq('id', survey.id);
              }
            }
          } else if (data.action === 'archive') {
            await supabase
              .from('surveys')
              .update({ status: 'cancelled', cancelled_at: now, previous_status: 'active' })
              .eq('project_id', project.id)
              .eq('status', 'active');
          }
        }
      }

      if (successCount === 0) {
        return { error: 'projects.errors.unexpected' };
      }

      return { success: true };
    },
  }
);
