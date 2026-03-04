import { describe, expect, it } from 'vitest';

import type { ResearchJourneyData } from '@/features/profile/types';

import { buildMilestones } from './build-milestones';

function makeJourney(overrides: Partial<ResearchJourneyData> = {}): ResearchJourneyData {
  return {
    memberSince: '2024-01-01',
    firstProjectAt: null,
    firstSurveyAt: null,
    firstResponseAt: null,
    totalResponses: 0,
    ...overrides,
  };
}

describe('buildMilestones', () => {
  it('returns 9 milestones in correct order', () => {
    const milestones = buildMilestones(makeJourney());

    expect(milestones).toHaveLength(9);
    expect(milestones.map((m) => m.key)).toEqual([
      'joined',
      'first_project',
      'first_survey',
      'first_response',
      'responses_10',
      'responses_50',
      'responses_100',
      'responses_500',
      'responses_1000',
    ]);
  });

  it('marks joined as achieved when memberSince is set', () => {
    const milestones = buildMilestones(makeJourney({ memberSince: '2024-01-01' }));

    expect(milestones[0]).toEqual({
      key: 'joined',
      achievedAt: '2024-01-01',
      isNextGoal: false,
    });
  });

  it('marks first unachieved milestone as isNextGoal', () => {
    const milestones = buildMilestones(makeJourney());
    const nextGoals = milestones.filter((m) => m.isNextGoal);

    expect(nextGoals).toHaveLength(1);
    // joined is achieved, so first_project is the next goal
    expect(nextGoals[0]!.key).toBe('first_project');
  });

  it('marks no milestone as isNextGoal when all are achieved', () => {
    const milestones = buildMilestones(
      makeJourney({
        memberSince: '2024-01-01',
        firstProjectAt: '2024-02-01',
        firstSurveyAt: '2024-03-01',
        firstResponseAt: '2024-04-01',
        totalResponses: 1000,
      })
    );

    const nextGoals = milestones.filter((m) => m.isNextGoal);

    expect(nextGoals).toHaveLength(0);
    expect(milestones.every((m) => m.achievedAt !== null)).toBe(true);
  });

  it('handles response threshold boundaries correctly', () => {
    // totalResponses = 9 → responses_10 not achieved
    const below = buildMilestones(
      makeJourney({
        firstProjectAt: '2024-02-01',
        firstSurveyAt: '2024-03-01',
        firstResponseAt: '2024-04-01',
        totalResponses: 9,
      })
    );
    const responses10Below = below.find((m) => m.key === 'responses_10');

    expect(responses10Below!.achievedAt).toBeNull();
    expect(responses10Below!.isNextGoal).toBe(true);

    // totalResponses = 10 → responses_10 achieved
    const exact = buildMilestones(
      makeJourney({
        firstProjectAt: '2024-02-01',
        firstSurveyAt: '2024-03-01',
        firstResponseAt: '2024-04-01',
        totalResponses: 10,
      })
    );
    const responses10Exact = exact.find((m) => m.key === 'responses_10');

    expect(responses10Exact!.achievedAt).toBe('achieved');
  });

  it('achieves multiple response thresholds at once', () => {
    const milestones = buildMilestones(
      makeJourney({
        firstProjectAt: '2024-02-01',
        firstSurveyAt: '2024-03-01',
        firstResponseAt: '2024-04-01',
        totalResponses: 150,
      })
    );

    expect(milestones.find((m) => m.key === 'responses_10')!.achievedAt).toBe('achieved');
    expect(milestones.find((m) => m.key === 'responses_50')!.achievedAt).toBe('achieved');
    expect(milestones.find((m) => m.key === 'responses_100')!.achievedAt).toBe('achieved');
    expect(milestones.find((m) => m.key === 'responses_500')!.achievedAt).toBeNull();
    expect(milestones.find((m) => m.key === 'responses_500')!.isNextGoal).toBe(true);
  });

  it('sets isNextGoal on first_response when earlier milestones are achieved but no responses yet', () => {
    const milestones = buildMilestones(
      makeJourney({
        firstProjectAt: '2024-02-01',
        firstSurveyAt: '2024-03-01',
        firstResponseAt: null,
        totalResponses: 0,
      })
    );

    expect(milestones.find((m) => m.key === 'first_response')!.isNextGoal).toBe(true);
  });
});
