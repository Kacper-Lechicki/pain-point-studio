import { describe, expect, it } from 'vitest';

import type { NextStepInput } from './next-step';
import { computeNextStep } from './next-step';

function makeInput(overrides: Partial<NextStepInput> = {}): NextStepInput {
  return {
    totalSurveys: 0,
    activeSurveys: 0,
    totalResponses: 0,
    responseLimit: 100,
    currentPhase: null,
    ...overrides,
  };
}

describe('computeNextStep', () => {
  it('returns create-survey when no surveys exist', () => {
    const result = computeNextStep(makeInput({ totalSurveys: 0 }));

    expect(result).toEqual({
      action: 'create-survey',
      labelKey: 'projects.nextStep.createSurvey',
      tab: 'surveys',
    });
  });

  it('returns activate-survey when surveys exist but none are active', () => {
    const result = computeNextStep(makeInput({ totalSurveys: 2, activeSurveys: 0 }));

    expect(result).toEqual({
      action: 'activate-survey',
      labelKey: 'projects.nextStep.activateSurvey',
      tab: 'surveys',
    });
  });

  it('returns share-survey when responses are below 50% of target', () => {
    const result = computeNextStep(
      makeInput({ totalSurveys: 1, activeSurveys: 1, totalResponses: 49, responseLimit: 100 })
    );

    expect(result).toEqual({
      action: 'share-survey',
      labelKey: 'projects.nextStep.shareSurvey',
    });
  });

  it('returns share-survey at exactly 0 responses', () => {
    const result = computeNextStep(
      makeInput({ totalSurveys: 1, activeSurveys: 1, totalResponses: 0, responseLimit: 100 })
    );

    expect(result.action).toBe('share-survey');
  });

  it('returns share-survey at exactly 49% of target', () => {
    const result = computeNextStep(
      makeInput({ totalSurveys: 1, activeSurveys: 1, totalResponses: 49, responseLimit: 100 })
    );

    expect(result.action).toBe('share-survey');
  });

  it('returns continue when responses reach 50% of target', () => {
    const result = computeNextStep(
      makeInput({ totalSurveys: 1, activeSurveys: 1, totalResponses: 50, responseLimit: 100 })
    );

    expect(result).toEqual({
      action: 'continue',
      labelKey: 'projects.nextStep.continue',
    });
  });

  it('returns continue when responses are well above threshold', () => {
    const result = computeNextStep(
      makeInput({ totalSurveys: 3, activeSurveys: 2, totalResponses: 200, responseLimit: 100 })
    );

    expect(result.action).toBe('continue');
  });
});
