import type { SurveyStats } from '@/features/surveys/types';

export type AlertType = 'low-completion' | 'approaching-cap';

export interface OverviewAlert {
  type: AlertType;
  messageKey: string;
  values: Record<string, string | number>;
}

export function getOverviewAlert(stats: SurveyStats): OverviewAlert | null {
  const { totalResponses, completedResponses } = stats;
  const { maxRespondents } = stats.survey;

  if (totalResponses >= 5) {
    const rate = Math.round((completedResponses / totalResponses) * 100);

    if (rate < 50) {
      return {
        type: 'low-completion',
        messageKey: 'surveys.stats.overview.alertLowCompletion',
        values: { rate },
      };
    }
  }

  if (maxRespondents != null && maxRespondents > 0) {
    const usage = totalResponses / maxRespondents;

    if (usage >= 0.8) {
      return {
        type: 'approaching-cap',
        messageKey: 'surveys.stats.overview.alertApproachingCap',
        values: { current: totalResponses, max: maxRespondents },
      };
    }
  }

  return null;
}
