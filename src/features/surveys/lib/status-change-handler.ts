import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { type SurveyAction, getActionTargetStatus } from '@/features/surveys/config/survey-status';

interface StatusChangeResult {
  /** Whether the acted-on survey should be deselected from the detail sheet. */
  shouldDeselect: boolean;
  /** Updated survey list after applying the optimistic change. */
  updatedSurveys: UserSurvey[];
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
  const newStatus = getActionTargetStatus(action as SurveyAction);

  const shouldDeselect = newStatus === null || deselectOnStatuses.includes(newStatus);

  if (newStatus === null) {
    return {
      shouldDeselect,
      updatedSurveys: surveys.filter((s) => s.id !== surveyId),
    };
  }

  return {
    shouldDeselect,
    updatedSurveys: surveys.map((s) =>
      s.id === surveyId ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s
    ),
  };
}
