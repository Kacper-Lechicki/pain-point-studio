import { notFound } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { DashboardPageBack } from '@/features/dashboard/components/layout/dashboard-page-back';
import { getSurveyStats, getUserSurveys } from '@/features/surveys/actions';
import { SurveyStatsPanel } from '@/features/surveys/components/stats/survey-stats-panel';
import { getProjectDetailUrl } from '@/lib/common/urls/project-urls';

interface SurveyStatsPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function SurveyStatsPage({ params }: SurveyStatsPageProps) {
  const { id } = await params;
  const [stats, surveys, t] = await Promise.all([
    getSurveyStats(id),
    getUserSurveys(),
    getTranslations(),
  ]);

  if (!stats) {
    notFound();
  }

  const survey = surveys?.find((s) => s.id === id) ?? null;
  const backHref = survey ? getProjectDetailUrl(survey.projectId) : '/dashboard/projects';

  return (
    <>
      <DashboardPageBack href={backHref} label={t('common.backToProject')} />

      <PageTransition>
        <SurveyStatsPanel stats={stats} survey={survey} />
      </PageTransition>
    </>
  );
}
