'use client';

import { useCallback } from 'react';

import { ROUTES } from '@/config/routes';
import { useBreadcrumbSegment } from '@/features/dashboard/components/layout/breadcrumb-context';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { SurveyDetailPanel } from '@/features/surveys/components/dashboard/survey-detail-panel';
import type { MappedQuestion } from '@/features/surveys/lib/map-question-row';
import { useRouter } from '@/i18n/routing';

interface SurveyDetailPageClientProps {
  survey: UserSurvey;
  questions: MappedQuestion[] | null;
}

export function SurveyDetailPageClient({ survey, questions }: SurveyDetailPageClientProps) {
  const router = useRouter();

  useBreadcrumbSegment(survey.id, survey.title);

  const handleStatusChange = useCallback(
    (..._args: [string, string]) => {
      void _args;
      router.push(ROUTES.dashboard.research);
    },
    [router]
  );

  return (
    <SurveyDetailPanel
      survey={survey}
      questions={questions}
      onStatusChange={handleStatusChange}
      variant="page"
    />
  );
}
