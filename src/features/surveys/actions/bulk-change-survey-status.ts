'use server';

import { z } from 'zod';

import { type SurveyAction, canTransition } from '@/features/surveys/config/survey-status';
import type { SurveyStatus } from '@/features/surveys/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

const BULK_ACTIONS = [
  'complete',
  'cancel',
  'reopen',
  'archive',
  'restore',
  'trash',
  'restoreTrash',
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
): Record<string, unknown> {
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
  }
}

export const bulkChangeSurveyStatus = withProtectedAction<typeof bulkChangeSurveyStatusSchema>(
  'bulk-change-survey-status',
  {
    schema: bulkChangeSurveyStatusSchema,
    rateLimit: RATE_LIMITS.crud,
    action: async ({ data, user, supabase }) => {
      const { data: surveys } = await supabase
        .from('surveys')
        .select('id, status, previous_status, pre_trash_status')
        .in('id', data.surveyIds)
        .eq('user_id', user.id);

      if (!surveys || surveys.length === 0) {
        return { error: 'surveys.errors.unexpected' };
      }

      let successCount = 0;

      for (const survey of surveys) {
        if (!canTransition(survey.status as SurveyStatus, data.action as SurveyAction)) {
          continue;
        }

        const updatePayload = buildUpdatePayload(
          data.action,
          survey.status,
          survey.previous_status,
          survey.pre_trash_status
        );

        const { error } = await supabase
          .from('surveys')
          .update(updatePayload)
          .eq('id', survey.id)
          .eq('user_id', user.id);

        if (error) {
          continue;
        }

        successCount++;
      }

      if (successCount === 0) {
        return { error: 'surveys.errors.unexpected' };
      }

      return { success: true };
    },
  }
);
