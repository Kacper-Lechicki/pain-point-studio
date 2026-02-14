'use server';

import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

import { SURVEY_TRANSITIONS, type SurveyAction } from '../config/survey-status';
import type { SurveyStatus } from '../types';
import { surveyIdSchema } from '../types';

// ── Timestamp columns set on specific transitions ───────────────────

const TIMESTAMP_COLUMNS: Partial<Record<SurveyStatus, string>> = {
  closed: 'closed_at',
  cancelled: 'cancelled_at',
  archived: 'archived_at',
};

// ── Factory ─────────────────────────────────────────────────────────

function createStatusAction(action: SurveyAction) {
  const transition = SURVEY_TRANSITIONS[action];

  return withProtectedAction<typeof surveyIdSchema, void>(`${action}-survey`, {
    schema: surveyIdSchema,
    rateLimit: RATE_LIMITS.crud,
    action: async ({ data, user, supabase }) => {
      // Delete actions
      if (transition.method === 'delete') {
        const { data: row, error } = await (
          transition.fromStatuses.length === 1
            ? supabase
                .from('surveys')
                .delete()
                .eq('id', data.surveyId)
                .eq('user_id', user.id)
                .eq('status', transition.fromStatuses[0])
            : supabase
                .from('surveys')
                .delete()
                .eq('id', data.surveyId)
                .eq('user_id', user.id)
                .in('status', [...transition.fromStatuses])
        )
          .select('id')
          .maybeSingle();

        if (error || !row) {
          return { error: 'surveys.errors.unexpected' };
        }

        return { success: true };
      }

      // Restore: dynamic target status from previous_status column
      if (action === 'restore') {
        const { data: current } = await supabase
          .from('surveys')
          .select('previous_status')
          .eq('id', data.surveyId)
          .eq('user_id', user.id)
          .eq('status', 'archived')
          .maybeSingle();

        if (!current?.previous_status) {
          return { error: 'surveys.errors.unexpected' };
        }

        const { data: row, error } = await supabase
          .from('surveys')
          .update({
            status: current.previous_status as SurveyStatus,
            archived_at: null,
            previous_status: null,
          })
          .eq('id', data.surveyId)
          .eq('user_id', user.id)
          .eq('status', 'archived')
          .select('id')
          .maybeSingle();

        if (error || !row) {
          return { error: 'surveys.errors.unexpected' };
        }

        return { success: true };
      }

      // Standard update transitions
      const toStatus = transition.toStatus!;
      const updatePayload: Record<string, unknown> = { status: toStatus };

      // Set timestamp column for the target status
      const tsCol = TIMESTAMP_COLUMNS[toStatus];

      if (tsCol) {
        updatePayload[tsCol] = new Date().toISOString();
      }

      // Archive: save current status as previous_status for restore
      if (action === 'archive') {
        // We need to fetch current status first to save it
        const { data: current } = await supabase
          .from('surveys')
          .select('status')
          .eq('id', data.surveyId)
          .eq('user_id', user.id)
          .in('status', [...transition.fromStatuses])
          .maybeSingle();

        if (!current) {
          return { error: 'surveys.errors.unexpected' };
        }

        updatePayload.previous_status = current.status;
      }

      const { data: row, error } = await (
        transition.fromStatuses.length === 1
          ? supabase
              .from('surveys')
              .update(updatePayload)
              .eq('id', data.surveyId)
              .eq('user_id', user.id)
              .eq('status', transition.fromStatuses[0])
          : supabase
              .from('surveys')
              .update(updatePayload)
              .eq('id', data.surveyId)
              .eq('user_id', user.id)
              .in('status', [...transition.fromStatuses])
      )
        .select('id')
        .maybeSingle();

      if (error || !row) {
        return { error: 'surveys.errors.unexpected' };
      }

      return { success: true };
    },
  });
}

export const closeSurvey = createStatusAction('close');
export const cancelSurvey = createStatusAction('cancel');
export const archiveSurvey = createStatusAction('archive');
export const restoreSurvey = createStatusAction('restore');
export const deleteSurveyDraft = createStatusAction('delete');
