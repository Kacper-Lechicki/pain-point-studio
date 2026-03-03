'use server';

import { z } from 'zod';

import { type SurveyAction, canTransition } from '@/features/surveys/config/survey-status';
import type { SurveyStatus } from '@/features/surveys/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

/** Actions that require the parent project to be active. */
const ACTIONS_REQUIRING_ACTIVE_PROJECT = new Set<string>(['reopen', 'restore', 'restoreTrash']);

const BULK_ACTIONS = [
  'complete',
  'cancel',
  'reopen',
  'archive',
  'restore',
  'trash',
  'restoreTrash',
  'permanentDelete',
] as const;

const bulkChangeSurveyStatusSchema = z.object({
  surveyIds: z.array(z.uuid()).min(1).max(50),
  action: z.enum(BULK_ACTIONS),
});

function buildUpdatePayload(
  action: (typeof BULK_ACTIONS)[number],
  currentStatus: string,
  previousStatus: string | null,
  preTrashStatus: string | null
): Record<string, unknown> | null {
  const now = new Date().toISOString();

  switch (action) {
    case 'complete':
      return { status: 'completed', completed_at: now };
    case 'cancel':
      return { status: 'cancelled', cancelled_at: now };
    case 'reopen':
      return { status: 'active', completed_at: null, cancelled_at: null };
    case 'archive':
      return { status: 'archived', archived_at: now, previous_status: currentStatus };
    case 'restore':
      return { status: previousStatus || 'draft', archived_at: null, previous_status: null };
    case 'trash':
      return { status: 'trashed', deleted_at: now, pre_trash_status: currentStatus };
    case 'restoreTrash':
      return { status: preTrashStatus || 'draft', deleted_at: null, pre_trash_status: null };
    case 'permanentDelete':
      return null; // Handled as delete, not update
  }
}

export interface BulkResult {
  total: number;
  failed: number;
  failedIds: string[];
}

export const bulkChangeSurveyStatus = withProtectedAction<
  typeof bulkChangeSurveyStatusSchema,
  BulkResult
>('bulk-change-survey-status', {
  schema: bulkChangeSurveyStatusSchema,
  rateLimit: RATE_LIMITS.crud,
  action: async ({ data, user, supabase }) => {
    const { data: surveys } = await supabase
      .from('surveys')
      .select('id, status, previous_status, pre_trash_status, project_id')
      .in('id', data.surveyIds)
      .eq('user_id', user.id);

    if (!surveys || surveys.length === 0) {
      return { error: 'surveys.errors.unexpected' };
    }

    // Pre-check: if action requires active project, fetch project statuses
    let activeProjectIds: Set<string> | null = null;

    if (ACTIONS_REQUIRING_ACTIVE_PROJECT.has(data.action)) {
      const projectIds = [...new Set(surveys.map((s) => s.project_id).filter(Boolean))] as string[];

      if (projectIds.length > 0) {
        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .in('id', projectIds)
          .eq('status', 'active');

        activeProjectIds = new Set((projects ?? []).map((p) => p.id));
      } else {
        activeProjectIds = new Set();
      }
    }

    const total = data.surveyIds.length;
    let successCount = 0;
    const failedIds: string[] = [];

    for (const survey of surveys) {
      if (!canTransition(survey.status as SurveyStatus, data.action as SurveyAction)) {
        failedIds.push(survey.id);
        continue;
      }

      // Skip if action requires active project but project isn't active
      if (activeProjectIds && survey.project_id && !activeProjectIds.has(survey.project_id)) {
        failedIds.push(survey.id);
        continue;
      }

      const updatePayload = buildUpdatePayload(
        data.action,
        survey.status,
        survey.previous_status,
        survey.pre_trash_status
      );

      let error: { message: string } | null = null;

      if (updatePayload === null) {
        // permanentDelete: hard delete
        ({ error } = await supabase
          .from('surveys')
          .delete()
          .eq('id', survey.id)
          .eq('user_id', user.id));
      } else {
        ({ error } = await supabase
          .from('surveys')
          .update(updatePayload)
          .eq('id', survey.id)
          .eq('user_id', user.id));
      }

      if (error) {
        failedIds.push(survey.id);
        continue;
      }

      successCount++;
    }

    const failed = total - successCount;

    if (successCount === 0) {
      return { error: 'surveys.errors.bulkAllFailed', data: { total, failed, failedIds } };
    }

    return { success: true, data: { total, failed, failedIds } };
  },
});
