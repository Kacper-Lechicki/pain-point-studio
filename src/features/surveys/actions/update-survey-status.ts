'use server';

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

// ── Factory ─────────────────────────────────────────────────────────

function createStatusAction(action: SurveyAction) {
  const transition = SURVEY_TRANSITIONS[action];

  return withProtectedAction<typeof surveyIdSchema, void>(`${action}-survey`, {
    schema: surveyIdSchema,
    rateLimit: RATE_LIMITS.crud,
    action: async ({ data, user, db }) => {
      // Delete actions
      if (transition.method === 'delete') {
        const { data: row, error } = await db.surveys.delete(data.surveyId, {
          userId: user.id,
          status: [...transition.fromStatuses],
        });

        if (error || !row) {
          return { error: 'surveys.errors.unexpected' };
        }

        return { success: true };
      }

      // Restore: reset to a clean draft state.
      // Clear all publication-related fields so the next publish cycle starts
      // fresh, and delete old responses so metrics don't carry over.
      if (action === 'restore') {
        const { data: row, error } = await db.surveys.update(
          data.surveyId,
          {
            status: 'draft' as SurveyStatus,
            slug: null,
            starts_at: null,
            ends_at: null,
            max_respondents: null,
            completed_at: null,
            cancelled_at: null,
            archived_at: null,
            previous_status: null,
          },
          { userId: user.id, status: 'archived' }
        );

        if (error || !row) {
          return { error: 'surveys.errors.unexpected' };
        }

        // Delete old responses so metrics start from zero on re-publish.
        await db.surveyResponses.deleteBySurveyId(data.surveyId);

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
        const { data: current } = await db.surveys.findByIdSelect<{ status: string }>(
          data.surveyId,
          'status',
          { userId: user.id, status: [...transition.fromStatuses] }
        );

        if (!current) {
          return { error: 'surveys.errors.unexpected' };
        }

        updatePayload.previous_status = current.status;
      }

      const { data: row, error } = await db.surveys.update(data.surveyId, updatePayload, {
        userId: user.id,
        status:
          transition.fromStatuses.length === 1
            ? transition.fromStatuses[0]
            : [...transition.fromStatuses],
      });

      if (error || !row) {
        return { error: 'surveys.errors.unexpected' };
      }

      return { success: true };
    },
  });
}

export const completeSurvey = createStatusAction('complete');
export const cancelSurvey = createStatusAction('cancel');
export const archiveSurvey = createStatusAction('archive');
export const restoreSurvey = createStatusAction('restore');
export const deleteSurveyDraft = createStatusAction('delete');
