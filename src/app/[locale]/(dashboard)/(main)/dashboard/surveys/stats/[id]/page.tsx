import { notFound } from 'next/navigation';

import { PageTransition } from '@/components/ui/page-transition';
import { DashboardPageBack } from '@/features/dashboard/components/layout/dashboard-page-back';
import { getSurveyStats } from '@/features/surveys/actions';
import { SurveyStatsPanel } from '@/features/surveys/components/stats/survey-stats-panel';

interface SurveyStatsPageProps {
  params: Promise<{ id: string }>;
}

export default async function SurveyStatsPage({ params }: SurveyStatsPageProps) {
  const { id } = await params;
  const stats = await getSurveyStats(id);

  if (!stats) {
    notFound();
  }

  return (
    <>
      <DashboardPageBack />
      <PageTransition>
        <SurveyStatsPanel stats={stats} />
      </PageTransition>
    </>
  );
}
