import type { UserSurvey } from '@/features/surveys/types';
import type { SurveyStatus } from '@/features/surveys/types';

interface StatusChangeResult {
  /** Whether the acted-on survey should be deselected from the detail sheet. */
  shouldDeselect: boolean;
  /** Updated survey list after applying the optimistic change. */
  updatedSurveys: UserSurvey[];
}

/**
 * Resolves the target status for an action, handling dynamic targets
 * (restore → previousStatus, restoreTrash → preTrashStatus).
 * Returns `null` for actions that remove the survey (permanentDelete).
 */
function resolveTargetStatus(action: string, survey: UserSurvey): SurveyStatus | null {
  switch (action) {
    case 'complete':
      return 'completed';
    case 'cancel':
      return 'cancelled';
    case 'reopen':
      return 'active';
    case 'archive':
      return 'archived';
    case 'restore':
      return (survey.previousStatus as SurveyStatus) ?? 'draft';
    case 'trash':
      return 'trashed';
    case 'restoreTrash':
      return (survey.preTrashStatus as SurveyStatus) ?? 'draft';
    case 'permanentDelete':
      return null;
    default:
      return null;
  }
}

/**
 * Applies an optimistic status change to a local survey list.
 *
 * - Deletion actions remove the survey from the list.
 * - Transition actions update the `status` and `updatedAt` fields.
 * - Returns whether the detail sheet should be closed for the affected survey.
 */
export function applyOptimisticStatusChange(
  surveys: UserSurvey[],
  surveyId: string,
  action: string,
  /** Statuses that should trigger deselection when transitioned to (e.g. 'archived'). */
  deselectOnStatuses: readonly string[] = []
): StatusChangeResult {
  const survey = surveys.find((s) => s.id === surveyId);

  if (!survey) {
    return { shouldDeselect: false, updatedSurveys: surveys };
  }

  const newStatus = resolveTargetStatus(action, survey);

  if (newStatus === null) {
    return {
      shouldDeselect: true,
      updatedSurveys: surveys.filter((s) => s.id !== surveyId),
    };
  }

  const shouldDeselect = deselectOnStatuses.includes(newStatus);

  return {
    shouldDeselect,
    updatedSurveys: surveys.map((s) =>
      s.id === surveyId ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s
    ),
  };
}
