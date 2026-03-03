import type { Milestone, MilestoneKey, ResearchJourneyData } from '@/features/profile/types';

const RESPONSE_THRESHOLDS = [10, 50, 100, 500, 1000] as const;

/**
 * Build the full list of milestones from raw journey data.
 *
 * All milestones are always visible — unachieved ones render as greyed-out
 * so the user sees the entire path ahead. Exactly one milestone (the first
 * unachieved one) is marked as `isNextGoal`.
 */
export function buildMilestones(data: ResearchJourneyData): Milestone[] {
  const milestones: Milestone[] = [];
  let foundNextGoal = false;

  const push = (key: MilestoneKey, achievedAt: string | null) => {
    const isNextGoal = !foundNextGoal && achievedAt === null;

    if (isNextGoal) {
      foundNextGoal = true;
    }

    milestones.push({ key, achievedAt, isNextGoal });
  };

  push('joined', data.memberSince);
  push('first_project', data.firstProjectAt);
  push('first_survey', data.firstSurveyAt);
  push('first_response', data.firstResponseAt);

  for (const threshold of RESPONSE_THRESHOLDS) {
    const achieved = data.totalResponses >= threshold;
    push(`responses_${threshold}` as MilestoneKey, achieved ? 'achieved' : null);
  }

  return milestones;
}
