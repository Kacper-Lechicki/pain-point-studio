import { notFound } from 'next/navigation';

import { PageTransition } from '@/components/ui/page-transition';
import { getPublicSurvey, recordView } from '@/features/surveys/actions/respondent';
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
    return (
      <PageTransition>
        <SurveyClosed reason={survey.closedReason ?? 'completed'} title={survey.title} />
      </PageTransition>
    );
  }

  void recordView(survey.id);

  return (
    <PageTransition>
      <SurveyLanding survey={survey} slug={slug} />
    </PageTransition>
  );
}
