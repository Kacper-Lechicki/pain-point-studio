import { notFound } from 'next/navigation';

import { PageTransition } from '@/components/ui/page-transition';
import { DashboardPageBack } from '@/features/dashboard/components/layout/dashboard-page-back';
import { getSurveyStats, getUserSurveys } from '@/features/surveys/actions';
import { SurveyStatsPanel } from '@/features/surveys/components/stats/survey-stats-panel';

interface SurveyStatsPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function SurveyStatsPage({ params }: SurveyStatsPageProps) {
  const { id } = await params;
  const [stats, surveys] = await Promise.all([getSurveyStats(id), getUserSurveys()]);

  if (!stats) {
    notFound();
  }

  const survey = surveys?.find((s) => s.id === id) ?? null;

  return (
    <>
      <DashboardPageBack />

      <PageTransition>
        <SurveyStatsPanel stats={stats} survey={survey} />
      </PageTransition>
    </>
  );
}
