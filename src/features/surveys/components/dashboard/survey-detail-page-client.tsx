'use client';

import { useCallback } from 'react';

import { ROUTES } from '@/config/routes';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import type { MappedQuestion } from '@/features/surveys/lib/map-question-row';
import { useRouter } from '@/i18n/routing';

import { SurveyDetailPanel } from './survey-detail-panel';

interface SurveyDetailPageClientProps {
  survey: UserSurvey;
  questions: MappedQuestion[] | null;
}

export function SurveyDetailPageClient({ survey, questions }: SurveyDetailPageClientProps) {
  const router = useRouter();

  const handleStatusChange = useCallback(
    (..._args: [string, string]) => {
      void _args;
      router.push(ROUTES.dashboard.surveys);
    },
    [router]
  );

  return (
    <SurveyDetailPanel
      survey={survey}
      questions={questions}
      onStatusChange={handleStatusChange}
      embeddedInSheet={false}
      embeddedInPage
    />
  );
}
