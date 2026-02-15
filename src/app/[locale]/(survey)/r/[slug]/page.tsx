import { notFound } from 'next/navigation';

import { getPublicSurvey } from '@/features/surveys/actions/respondent';
import { SurveyClosed } from '@/features/surveys/components/respondent/survey-closed';
import { SurveyLanding } from '@/features/surveys/components/respondent/survey-landing';

interface SurveyRespondPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SurveyRespondPage({ params }: SurveyRespondPageProps) {
  const { slug } = await params;
  const survey = await getPublicSurvey(slug);

  if (!survey) {
    notFound();
  }

  if (!survey.isAcceptingResponses) {
    return <SurveyClosed reason={survey.closedReason ?? 'closed'} title={survey.title} />;
  }

  return <SurveyLanding survey={survey} slug={slug} />;
}
