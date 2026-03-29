'use server';

import { z } from 'zod';

import { type SurveyAction, canTransition } from '@/features/surveys/config/survey-status';
import type { SurveyStatus } from '@/features/surveys/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

const BULK_ACTIONS = ['complete', 'trash', 'restoreTrash', 'permanentDelete'] as const;

const bulkChangeSurveyStatusSchema = z.object({
  surveyIds: z.array(z.uuid()).min(1).max(50),
  action: z.enum(BULK_ACTIONS),
});

function buildUpdatePayload(
  action: (typeof BULK_ACTIONS)[number],
  currentStatus: SurveyStatus,
  preTrashStatus: string | null
): Record<string, unknown> | null {
  const now = new Date().toISOString();

  switch (action) {
    case 'complete':
      return { status: 'completed', completed_at: now };
    case 'trash':
      return { status: 'trashed', deleted_at: now, pre_trash_status: currentStatus };
    case 'restoreTrash':
      return { status: preTrashStatus || 'draft', deleted_at: null, pre_trash_status: null };
    case 'permanentDelete':
      return null;
  }
}

interface BulkResult {
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
      .select('id, status, pre_trash_status, project_id')
      .in('id', data.surveyIds)
      .eq('user_id', user.id);

    if (!surveys || surveys.length === 0) {
      return { error: 'surveys.errors.unexpected' };
    }

    const total = data.surveyIds.length;
    let successCount = 0;
    const failedIds: string[] = [];

    for (const survey of surveys) {
      let effectiveStatus = survey.status as SurveyStatus;

      // For trash action on active surveys, complete first then trash
      if (data.action === 'trash' && survey.status === 'active') {
        const { error: completeError } = await supabase
          .from('surveys')
          .update({
            status: 'completed' as SurveyStatus,
            completed_at: new Date().toISOString(),
          })
          .eq('id', survey.id)
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (completeError) {
          failedIds.push(survey.id);
          continue;
        }

        effectiveStatus = 'completed' as SurveyStatus;
      }

      if (
        data.action !== 'trash' &&
        !canTransition(survey.status as SurveyStatus, data.action as SurveyAction)
      ) {
        failedIds.push(survey.id);
        continue;
      }

      if (
        data.action === 'trash' &&
        !canTransition(survey.status as SurveyStatus, data.action as SurveyAction) &&
        survey.status !== 'active'
      ) {
        failedIds.push(survey.id);
        continue;
      }

      const updatePayload = buildUpdatePayload(
        data.action,
        effectiveStatus,
        survey.pre_trash_status
      );

      let mutationError: { message: string } | null = null;
      let affected: { id: string } | null = null;

      if (updatePayload === null) {
        const result = await supabase
          .from('surveys')
          .delete()
          .eq('id', survey.id)
          .eq('user_id', user.id)
          .eq('status', survey.status)
          .select('id')
          .maybeSingle();

        mutationError = result.error;
        affected = result.data;
      } else {
        const result = await supabase
          .from('surveys')
          .update(updatePayload)
          .eq('id', survey.id)
          .eq('user_id', user.id)
          .eq('status', effectiveStatus)
          .select('id')
          .maybeSingle();

        mutationError = result.error;
        affected = result.data;
      }

      if (mutationError || !affected) {
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
