'use server';

import { z } from 'zod';

import { type ProjectAction, canTransition } from '@/features/projects/config/status';
import type { ProjectStatus } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

/** Actions that can be handled by this generic status-change action. */
const STATUS_ACTIONS = [
  'complete',
  'archive',
  'reopen',
  'restore',
  'trash',
  'restoreTrash',
] as const;

const changeProjectStatusSchema = z.object({
  projectId: z.uuid(),
  action: z.enum(STATUS_ACTIONS),
});

/** Builds the Supabase update payload for a given status-change action. */
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

export const changeProjectStatus = withProtectedAction<typeof changeProjectStatusSchema>(
  'change-project-status',
  {
    schema: changeProjectStatusSchema,
    rateLimit: RATE_LIMITS.crud,
    action: async ({ data, user, supabase }) => {
      const { data: current } = await supabase
        .from('projects')
        .select('status, pre_trash_status, pre_archive_status')
        .eq('id', data.projectId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!current) {
        return { error: 'projects.errors.unexpected' };
      }

      if (!canTransition(current.status as ProjectStatus, data.action as ProjectAction)) {
        return { error: 'projects.errors.invalidTransition' };
      }

      const updatePayload = buildUpdatePayload(
        data.action,
        current.status,
        current.pre_trash_status,
        current.pre_archive_status
      );

      const { error } = await supabase
        .from('projects')
        .update(updatePayload)
        .eq('id', data.projectId)
        .eq('user_id', user.id);

      if (error) {
        return { error: 'projects.errors.unexpected' };
      }

      // ── Cascade to surveys ──────────────────────────────────────────
      const now = new Date().toISOString();

      if (data.action === 'trash') {
        // Trash all non-trashed surveys — each needs its own pre_trash_status
        const { data: surveys } = await supabase
          .from('surveys')
          .select('id, status')
          .eq('project_id', data.projectId)
          .neq('status', 'trashed');

        if (surveys) {
          for (const survey of surveys) {
            await supabase
              .from('surveys')
              .update({ status: 'trashed', deleted_at: now, pre_trash_status: survey.status })
              .eq('id', survey.id);
          }
        }
      } else if (data.action === 'restoreTrash') {
        // Restore all trashed surveys to their pre_trash_status
        const { data: surveys } = await supabase
          .from('surveys')
          .select('id, pre_trash_status')
          .eq('project_id', data.projectId)
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
        // Cancel active surveys (all share the same source status)
        await supabase
          .from('surveys')
          .update({ status: 'cancelled', cancelled_at: now, previous_status: 'active' })
          .eq('project_id', data.projectId)
          .eq('status', 'active');
      }

      return { success: true };
    },
  }
);
