import type { useTranslations } from 'next-intl';

import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { calculateCompletionRate } from '@/features/surveys/lib/calculations';

type HintSeverity = 'warning' | 'info' | 'success';

export interface CardHint {
  severity: HintSeverity;
  text: string;
}

export function computeHint(
  survey: UserSurvey,
  t: ReturnType<typeof useTranslations<'surveys.dashboard'>>
): CardHint | null {
  const now = new Date();

  if (survey.status === 'draft') {
    if (survey.questionCount === 0) {
      return { severity: 'info', text: t('hints.noQuestions') };
    }

    return {
      severity: 'success',
      text: t('hints.readyToPublish', { count: survey.questionCount }),
    };
  }

  if (survey.status === 'active') {
    if (survey.maxRespondents) {
      const pct = survey.responseCount / survey.maxRespondents;

      if (pct >= 1) {
        return { severity: 'warning', text: t('hints.limitReached') };
      }

      if (pct >= 0.8) {
        return {
          severity: 'warning',
          text: t('hints.nearingLimit', {
            current: survey.responseCount,
            max: survey.maxRespondents,
          }),
        };
      }
    }

    if (survey.endsAt) {
      const daysLeft = Math.ceil(
        (new Date(survey.endsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysLeft <= 0) {
        return { severity: 'warning', text: t('hints.expired') };
      }

      if (daysLeft <= 3) {
        return { severity: 'warning', text: t('hints.endingSoon', { days: daysLeft }) };
      }
    }

    if (survey.responseCount === 0) {
      return { severity: 'info', text: t('hints.noResponsesYet') };
    }
  }

  if (survey.status === 'closed') {
    if (survey.responseCount > 0) {
      const rate = calculateCompletionRate(survey.completedCount, survey.responseCount)!;

      return { severity: 'info', text: t('hints.completionRate', { rate }) };
    }

    return { severity: 'info', text: t('hints.noResponsesCollected') };
  }

  return null;
}
