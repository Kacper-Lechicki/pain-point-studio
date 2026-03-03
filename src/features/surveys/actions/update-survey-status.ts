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
  cancelled: 'cancelled_at',
  archived: 'archived_at',
};

// ── Helpers ──────────────────────────────────────────────────────────

/** Verifies the survey's parent project is active. Returns an error key if not. */
async function requireActiveProject(
  supabase: SupabaseClient,
  projectId: string | null
): Promise<string | null> {
  if (!projectId) {
    return null;
  }

  const { data: project } = await supabase
    .from('projects')
    .select('status')
    .eq('id', projectId)
    .maybeSingle();

  if (!project || project.status !== 'active') {
    return 'surveys.errors.projectNotActive';
  }

  return null;
}

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

  // Survey exists but status didn't match → conflict (stale data)
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

      // ── Reopen (completed/cancelled → active) ──────────────────
      if (action === 'reopen') {
        // Fetch survey to verify project is active before reactivating
        const { data: survey } = await supabase
          .from('surveys')
          .select('project_id')
          .eq('id', data.surveyId)
          .eq('user_id', user.id)
          .in('status', [...transition.fromStatuses])
          .maybeSingle();

        if (!survey) {
          return { error: await diagnoseUpdateFailure(supabase, data.surveyId, user.id) };
        }

        const projectError = await requireActiveProject(supabase, survey.project_id);

        if (projectError) {
          return { error: projectError };
        }

        const { data: row, error } = await supabase
          .from('surveys')
          .update({
            status: 'active' as SurveyStatus,
            completed_at: null,
            cancelled_at: null,
          })
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

      // ── Restore (archived → previous_status) ──────────────────
      if (action === 'restore') {
        const { data: current } = await supabase
          .from('surveys')
          .select('previous_status, project_id')
          .eq('id', data.surveyId)
          .eq('user_id', user.id)
          .eq('status', 'archived')
          .maybeSingle();

        if (!current) {
          return { error: await diagnoseUpdateFailure(supabase, data.surveyId, user.id) };
        }

        // Restoring to an active state requires the parent project to be active
        const projectError = await requireActiveProject(supabase, current.project_id);

        if (projectError) {
          return { error: projectError };
        }

        const { data: row, error } = await supabase
          .from('surveys')
          .update({
            status: (current.previous_status || 'draft') as SurveyStatus,
            archived_at: null,
            previous_status: null,
          })
          .eq('id', data.surveyId)
          .eq('user_id', user.id)
          .eq('status', 'archived')
          .select('id')
          .maybeSingle();

        if (error || !row) {
          return { error: await diagnoseUpdateFailure(supabase, data.surveyId, user.id) };
        }

        return { success: true };
      }

      // ── Trash (any → trashed) ──────────────────────────────────
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

        const { data: row, error } = await supabase
          .from('surveys')
          .update({
            status: 'trashed' as SurveyStatus,
            deleted_at: new Date().toISOString(),
            pre_trash_status: current.status,
          })
          .eq('id', data.surveyId)
          .eq('user_id', user.id)
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

        // Restoring from trash requires the parent project to be active
        const projectError = await requireActiveProject(supabase, current.project_id);

        if (projectError) {
          return { error: projectError };
        }

        const { data: row, error } = await supabase
          .from('surveys')
          .update({
            status: (current.pre_trash_status || 'draft') as SurveyStatus,
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

      // ── Standard update transitions (complete, cancel, archive) ─
      const toStatus = 'toStatus' in transition ? transition.toStatus : null;

      if (!toStatus) {
        return { error: 'surveys.errors.unexpected' };
      }

      const updatePayload: Record<string, unknown> = { status: toStatus };

      // Set timestamp column for the target status
      const tsCol = TIMESTAMP_COLUMNS[toStatus as SurveyStatus];

      if (tsCol) {
        updatePayload[tsCol] = new Date().toISOString();
      }

      // Archive: save current status as previous_status for restore
      if (action === 'archive') {
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

        updatePayload.previous_status = current.status;
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
export const cancelSurvey = createStatusAction('cancel');
export const reopenSurvey = createStatusAction('reopen');
export const archiveSurvey = createStatusAction('archive');
export const restoreSurvey = createStatusAction('restore');
export const trashSurvey = createStatusAction('trash');
export const restoreTrashSurvey = createStatusAction('restoreTrash');
export const permanentDeleteSurvey = createStatusAction('permanentDelete');
