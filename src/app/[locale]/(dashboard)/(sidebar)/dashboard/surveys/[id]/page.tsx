import { notFound } from 'next/navigation';

import { PageTransition } from '@/components/ui/page-transition';
import { DashboardPageBack } from '@/features/dashboard/components/layout/dashboard-page-back';
import { getSurveyWithQuestions, getUserSurveys } from '@/features/surveys/actions';
import { SurveyDetailPageClient } from '@/features/surveys/components/dashboard/survey-detail-page-client';

interface SurveyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SurveyDetailPage({ params }: SurveyDetailPageProps) {
  const { id } = await params;

  const [surveys, detailData] = await Promise.all([getUserSurveys(), getSurveyWithQuestions(id)]);

  const survey = surveys?.find((s) => s.id === id) ?? null;

  if (!survey) {
    notFound();
  }

  const questions = detailData?.questions ?? null;

  return (
    <>
      <DashboardPageBack />
      <PageTransition>
        <SurveyDetailPageClient survey={survey} questions={questions} />
      </PageTransition>
    </>
  );
}
