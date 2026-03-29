import type { ResearchPhase } from '@/features/projects/types';

export type NextStepAction = 'create-survey' | 'activate-survey' | 'share-survey' | 'continue';

interface NextStepResult {
  action: NextStepAction;
  labelKey: string;
  tab?: string;
}

export interface NextStepInput {
  totalSurveys: number;
  activeSurveys: number;
  totalResponses: number;
  responseLimit: number;
  currentPhase: ResearchPhase | null;
}

export function computeNextStep(input: NextStepInput): NextStepResult {
  const { totalSurveys, activeSurveys, totalResponses, responseLimit } = input;

  if (totalSurveys === 0) {
    return {
      action: 'create-survey',
      labelKey: 'projects.nextStep.createSurvey',
      tab: 'surveys',
    };
  }

  if (activeSurveys === 0) {
    return {
      action: 'activate-survey',
      labelKey: 'projects.nextStep.activateSurvey',
      tab: 'surveys',
    };
  }

  if (totalResponses < responseLimit * 0.5) {
    return {
      action: 'share-survey',
      labelKey: 'projects.nextStep.shareSurvey',
    };
  }

  return {
    action: 'continue',
    labelKey: 'projects.nextStep.continue',
  };
}
