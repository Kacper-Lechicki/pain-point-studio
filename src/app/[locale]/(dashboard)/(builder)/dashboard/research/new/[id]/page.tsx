import { notFound, redirect } from 'next/navigation';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config/routes';
import { getSurveyFormData, getSurveyWithQuestions } from '@/features/surveys/actions';
import { QuestionBuilderPage } from '@/features/surveys/components/builder/question-builder-page';

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
    redirect(`${ROUTES.dashboard.research}/${id}`);
  }

  return (
    <PageTransition className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <QuestionBuilderPage
        surveyId={data.survey.id}
        surveyTitle={data.survey.title}
        surveyStatus={data.survey.status}
        surveyMetadata={{
          description: data.survey.description,
          category: data.survey.category,
          visibility: data.survey.visibility,
        }}
        categoryOptions={formData.categoryOptions}
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
