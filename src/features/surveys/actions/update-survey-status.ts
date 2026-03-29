'use server';

import type { SupabaseClient } from '@supabase/supabase-js';

import { SURVEY_TRANSITIONS, type SurveyAction } from '@/features/surveys/config/survey-status';
import type { SurveyStatus } from '@/features/surveys/types';
import { surveyIdSchema } from '@/features/surveys/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

// ── Timestamp columns set on specific transitions ───────────────────

const TIMESTAMP_COLUMNS: Partial<Record<SurveyStatus, string>> = {
  completed: 'completed_at',
};

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * After a failed update (0 rows affected), re-query the survey to determine
 * whether it's a real "not found" or a status conflict (stale client data).
 */
async function diagnoseUpdateFailure(
  supabase: SupabaseClient,
  surveyId: string,
  userId: string
): Promise<string> {
  const { data: survey } = await supabase
    .from('surveys')
    .select('id')
    .eq('id', surveyId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!survey) {
    return 'surveys.errors.unexpected';
  }

  return 'surveys.errors.conflict';
}

// ── Factory ─────────────────────────────────────────────────────────

function createStatusAction(action: SurveyAction) {
  const transition = SURVEY_TRANSITIONS[action];

  return withProtectedAction<typeof surveyIdSchema, void>(`${action}-survey`, {
    schema: surveyIdSchema,
    rateLimit: RATE_LIMITS.crud,
    action: async ({ data, user, supabase }) => {
      // ── Permanent delete (hard delete) ──────────────────────────
      if (action === 'permanentDelete') {
        const { data: row, error } = await supabase
          .from('surveys')
          .delete()
          .eq('id', data.surveyId)
          .eq('user_id', user.id)
          .in('status', [...transition.fromStatuses])
          .select('id')
          .maybeSingle();

        if (error || !row) {
          return { error: await diagnoseUpdateFailure(supabase, data.surveyId, user.id) };
        }

        return { success: true };
      }

      // ── Trash (draft/active/completed → trashed) ───────────────
      if (action === 'trash') {
        const { data: current } = await supabase
          .from('surveys')
          .select('status')
          .eq('id', data.surveyId)
          .eq('user_id', user.id)
          .in('status', [...transition.fromStatuses])
          .maybeSingle();

        if (!current) {
          return { error: await diagnoseUpdateFailure(supabase, data.surveyId, user.id) };
        }

        // If trashing an active survey, complete it first
        if (current.status === 'active') {
          await supabase
            .from('surveys')
            .update({
              status: 'completed' as SurveyStatus,
              completed_at: new Date().toISOString(),
            })
            .eq('id', data.surveyId)
            .eq('user_id', user.id)
            .eq('status', 'active');
        }

        const preTrashStatus = current.status === 'active' ? 'completed' : current.status;

        const { data: row, error } = await supabase
          .from('surveys')
          .update({
            status: 'trashed' as SurveyStatus,
            deleted_at: new Date().toISOString(),
            pre_trash_status: preTrashStatus,
          })
          .eq('id', data.surveyId)
          .eq('user_id', user.id)
          .in('status', [preTrashStatus])
          .select('id')
          .maybeSingle();

        if (error || !row) {
          return { error: await diagnoseUpdateFailure(supabase, data.surveyId, user.id) };
        }

        return { success: true };
      }

      // ── Restore from trash (trashed → pre_trash_status) ────────
      if (action === 'restoreTrash') {
        const { data: current } = await supabase
          .from('surveys')
          .select('pre_trash_status, project_id')
          .eq('id', data.surveyId)
          .eq('user_id', user.id)
          .eq('status', 'trashed')
          .maybeSingle();

        if (!current) {
          return { error: await diagnoseUpdateFailure(supabase, data.surveyId, user.id) };
        }

        const restoredTrashStatus = (current.pre_trash_status || 'draft') as SurveyStatus;

        const { data: row, error } = await supabase
          .from('surveys')
          .update({
            status: restoredTrashStatus,
            deleted_at: null,
            pre_trash_status: null,
          })
          .eq('id', data.surveyId)
          .eq('user_id', user.id)
          .eq('status', 'trashed')
          .select('id')
          .maybeSingle();

        if (error || !row) {
          return { error: await diagnoseUpdateFailure(supabase, data.surveyId, user.id) };
        }

        return { success: true };
      }

      // ── Standard update transition (complete) ──────────────────
      const toStatus = 'toStatus' in transition ? transition.toStatus : null;

      if (!toStatus) {
        return { error: 'surveys.errors.unexpected' };
      }

      const updatePayload: Record<string, unknown> = { status: toStatus };

      const tsCol = TIMESTAMP_COLUMNS[toStatus as SurveyStatus];

      if (tsCol) {
        updatePayload[tsCol] = new Date().toISOString();
      }

      let query = supabase
        .from('surveys')
        .update(updatePayload)
        .eq('id', data.surveyId)
        .eq('user_id', user.id);

      if (transition.fromStatuses.length === 1) {
        query = query.eq('status', transition.fromStatuses[0]);
      } else {
        query = query.in('status', [...transition.fromStatuses]);
      }

      const { data: row, error } = await query.select('id').maybeSingle();

      if (error || !row) {
        return { error: await diagnoseUpdateFailure(supabase, data.surveyId, user.id) };
      }

      return { success: true };
    },
  });
}

export const completeSurvey = createStatusAction('complete');
export const trashSurvey = createStatusAction('trash');
export const restoreTrashSurvey = createStatusAction('restoreTrash');
export const permanentDeleteSurvey = createStatusAction('permanentDelete');
