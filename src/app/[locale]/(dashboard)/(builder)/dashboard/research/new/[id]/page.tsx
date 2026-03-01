import { notFound, redirect } from 'next/navigation';

import { PageTransition } from '@/components/ui/page-transition';
import { getSurveyFormData, getSurveyWithQuestions } from '@/features/surveys/actions';
import { QuestionBuilderPage } from '@/features/surveys/components/builder/question-builder-page';
import { getSurveyStatsUrl } from '@/features/surveys/lib/survey-urls';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SurveyBuilderRoute({ params }: Props) {
  const { id } = await params;

  const [data, formData] = await Promise.all([getSurveyWithQuestions(id), getSurveyFormData()]);

  if (!data) {
    notFound();
  }

  if (data.survey.status !== 'draft') {
    redirect(getSurveyStatsUrl(id));
  }

  return (
    <PageTransition className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <QuestionBuilderPage
        surveyId={data.survey.id}
        surveyTitle={data.survey.title}
        surveyStatus={data.survey.status}
        projectId={data.survey.projectId}
        surveyMetadata={{
          description: data.survey.description,
          visibility: data.survey.visibility,
          projectId: data.survey.projectId,
          researchPhase: data.survey.researchPhase,
        }}
        projectOptions={formData.projectOptions}
        initialQuestions={data.questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          required: q.required,
          description: q.description,
          config: q.config,
        }))}
      />
    </PageTransition>
  );
}
