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
  t: ReturnType<typeof useTranslations>
): CardHint | null {
  const now = new Date();

  if (survey.status === 'draft') {
    if (survey.questionCount === 0) {
      return { severity: 'info', text: t('surveys.dashboard.hints.noQuestions') };
    }

    return {
      severity: 'success',
      text: t(
        'surveys.dashboard.hints.readyToPublish' as Parameters<typeof t>[0],
        { count: survey.questionCount } as never
      ),
    };
  }

  if (survey.status === 'pending') {
    if (survey.startsAt) {
      const daysUntil = Math.ceil(
        (new Date(survey.startsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntil <= 0) {
        return { severity: 'info', text: t('surveys.dashboard.hints.activatingSoon') };
      }

      return {
        severity: 'info',
        text: t(
          'surveys.dashboard.hints.startsIn' as Parameters<typeof t>[0],
          { days: daysUntil } as never
        ),
      };
    }
  }

  if (survey.status === 'active') {
    if (survey.maxRespondents) {
      const pct = survey.responseCount / survey.maxRespondents;

      if (pct >= 1) {
        return { severity: 'warning', text: t('surveys.dashboard.hints.limitReached') };
      }

      if (pct >= 0.8) {
        return {
          severity: 'warning',
          text: t(
            'surveys.dashboard.hints.nearingLimit' as Parameters<typeof t>[0],
            {
              current: survey.responseCount,
              max: survey.maxRespondents,
            } as never
          ),
        };
      }
    }

    if (survey.endsAt) {
      const daysLeft = Math.ceil(
        (new Date(survey.endsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysLeft <= 0) {
        return { severity: 'warning', text: t('surveys.dashboard.hints.expired') };
      }

      if (daysLeft <= 3) {
        return {
          severity: 'warning',
          text: t(
            'surveys.dashboard.hints.endingSoon' as Parameters<typeof t>[0],
            { days: daysLeft } as never
          ),
        };
      }
    }

    if (survey.responseCount === 0) {
      return { severity: 'info', text: t('surveys.dashboard.hints.noResponsesYet') };
    }
  }

  if (survey.status === 'closed') {
    if (survey.responseCount > 0) {
      const rate = calculateCompletionRate(survey.completedCount, survey.responseCount)!;

      return {
        severity: 'info',
        text: t(
          'surveys.dashboard.hints.completionRate' as Parameters<typeof t>[0],
          { rate } as never
        ),
      };
    }

    return { severity: 'info', text: t('surveys.dashboard.hints.noResponsesCollected') };
  }

  if (survey.status === 'cancelled') {
    return { severity: 'warning', text: t('surveys.dashboard.hints.withdrawn') };
  }

  return null;
}
