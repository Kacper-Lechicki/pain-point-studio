import type { ProjectSurvey } from '@/features/projects/actions/get-project';
import { FINDING_THRESHOLDS } from '@/features/projects/config/signals';
import type { ResearchPhase } from '@/features/projects/types';
import { RESEARCH_PHASES } from '@/features/projects/types';

export type PhaseStatus = 'not_started' | 'in_progress' | 'validated';

/**
 * Compute per-phase validation status from surveysByPhase data.
 *
 * - `not_started` — no surveys in this phase
 * - `in_progress` — >=1 survey exists, but none completed with >= minResponses
 * - `validated`   — >=1 completed survey with >= minResponses responses
 */
export function computePhaseStatuses(
  surveysByPhase: Record<string, ProjectSurvey[]>
): Record<ResearchPhase, PhaseStatus> {
  const result = {} as Record<ResearchPhase, PhaseStatus>;

  for (const phase of RESEARCH_PHASES) {
    const surveys = surveysByPhase[phase] ?? [];

    if (surveys.length === 0) {
      result[phase] = 'not_started';
      continue;
    }

    const hasValidated = surveys.some(
      (s) => s.status === 'completed' && s.completedCount >= FINDING_THRESHOLDS.minResponses
    );

    result[phase] = hasValidated ? 'validated' : 'in_progress';
  }

  return result;
}
