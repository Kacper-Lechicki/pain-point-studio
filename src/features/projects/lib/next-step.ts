import type { ResearchPhase } from '@/features/projects/types';

// ── Types ────────────────────────────────────────────────────────────

export type NextStepAction =
  | 'create-survey'
  | 'activate-survey'
  | 'share-survey'
  | 'review-findings'
  | 'make-decision'
  | 'continue';

export interface NextStepResult {
  action: NextStepAction;
  /** i18n key for the CTA description. */
  labelKey: string;
  /** Optional tab or route to link to. */
  tab?: string;
}

export interface NextStepInput {
  totalSurveys: number;
  activeSurveys: number;
  totalResponses: number;
  targetResponses: number;
  insightCount: number;
  currentPhase: ResearchPhase | null;
}

// ── Main ─────────────────────────────────────────────────────────────

/**
 * Determine the single most relevant next action for a project.
 * Returns exactly one CTA based on the project's current state.
 */
export function computeNextStep(input: NextStepInput): NextStepResult {
  const { totalSurveys, activeSurveys, totalResponses, targetResponses, insightCount } = input;

  // No surveys yet — first step is to create one
  if (totalSurveys === 0) {
    return {
      action: 'create-survey',
      labelKey: 'projects.nextStep.createSurvey',
      tab: 'surveys',
    };
  }

  // Has drafts but nothing active
  if (activeSurveys === 0) {
    return {
      action: 'activate-survey',
      labelKey: 'projects.nextStep.activateSurvey',
      tab: 'surveys',
    };
  }

  // Active surveys but below halfway to target
  if (totalResponses < targetResponses * 0.5) {
    return {
      action: 'share-survey',
      labelKey: 'projects.nextStep.shareSurvey',
    };
  }

  // Enough responses but no insights yet
  if (insightCount === 0) {
    return {
      action: 'review-findings',
      labelKey: 'projects.nextStep.reviewFindings',
      tab: 'insights',
    };
  }

  // Has insights and good data — time to decide
  if (totalResponses >= targetResponses * 0.7 && insightCount >= 3) {
    return {
      action: 'make-decision',
      labelKey: 'projects.nextStep.makeDecision',
      tab: 'insights',
    };
  }

  // Default: keep going
  return {
    action: 'continue',
    labelKey: 'projects.nextStep.continue',
  };
}
