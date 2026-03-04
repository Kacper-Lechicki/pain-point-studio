import type { useTranslations } from 'next-intl';

import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import {
  RESPONDENT_LIMIT_WARNING_THRESHOLD,
  SURVEY_ENDING_SOON_DAYS,
} from '@/features/surveys/config';
import { deriveSurveyFlags } from '@/features/surveys/config/survey-status';
import { calculateSubmissionRate } from '@/features/surveys/lib/calculations';

type HintSeverity = 'warning' | 'info' | 'success';

interface CardHint {
  severity: HintSeverity;
  text: string;
}

export function computeHint(
  survey: UserSurvey,
  t: ReturnType<typeof useTranslations>
): CardHint | null {
  const now = new Date();
  const { isDraft, isActive, isCompleted, isCancelled } = deriveSurveyFlags(survey.status);

  if (isDraft) {
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

  if (isActive) {
    if (survey.maxRespondents) {
      const pct = survey.responseCount / survey.maxRespondents;

      if (pct >= 1) {
        return { severity: 'warning', text: t('surveys.dashboard.hints.limitReached') };
      }

      if (pct >= RESPONDENT_LIMIT_WARNING_THRESHOLD) {
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

      if (daysLeft <= SURVEY_ENDING_SOON_DAYS) {
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

  if (isCompleted) {
    if (survey.responseCount > 0) {
      const rate = calculateSubmissionRate(survey.completedCount, survey.responseCount)!;

      return {
        severity: 'info',
        text: t(
          'surveys.dashboard.hints.submissionRate' as Parameters<typeof t>[0],
          { rate } as never
        ),
      };
    }

    return { severity: 'info', text: t('surveys.dashboard.hints.noResponsesCollected') };
  }

  if (isCancelled) {
    return { severity: 'warning', text: t('surveys.dashboard.hints.withdrawn') };
  }

  return null;
}
