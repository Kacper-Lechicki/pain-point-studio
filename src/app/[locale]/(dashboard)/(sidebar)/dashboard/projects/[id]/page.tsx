import { notFound } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { DashboardPageBack } from '@/features/dashboard/components/layout/dashboard-page-back';
import { getNoteFolders } from '@/features/projects/actions/get-note-folders';
import { getProject } from '@/features/projects/actions/get-project';
import { getProjectInsights } from '@/features/projects/actions/get-project-insights';
import { getProjectNotes } from '@/features/projects/actions/get-project-notes';
import { getProjectOverviewStats } from '@/features/projects/actions/get-project-overview-stats';
import { ProjectDashboardPage } from '@/features/projects/components/project-dashboard-page';
import { getProjectSurveys } from '@/features/surveys/actions';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const [data, insights, overviewStats, projectSurveys, notesMeta, noteFolders, t] =
    await Promise.all([
      getProject(id),
      getProjectInsights(id),
      getProjectOverviewStats(id),
      getProjectSurveys(id),
      getProjectNotes(id),
      getNoteFolders(id),
      getTranslations(),
    ]);

  if (!data) {
    notFound();
  }

  return (
    <>
      <DashboardPageBack href={ROUTES.dashboard.projects} label={t('common.backToProjects')} />

      <PageTransition>
        <ProjectDashboardPage
          project={data.project}
          owner={data.owner}
          surveys={projectSurveys ?? []}
          insights={insights}
          notesMeta={notesMeta}
          noteFolders={noteFolders}
          overviewStats={
            overviewStats ?? {
              totalSurveys: 0,
              activeSurveys: 0,
              totalResponses: 0,
              avgCompletion: 0,
              avgTimeSeconds: null,
              lastResponseAt: null,
              recentActivity: [],
              responsesTimeline: [],
              surveyStatusDistribution: { draft: 0, active: 0, completed: 0 },
              completionBreakdown: { completed: 0, inProgress: 0, abandoned: 0 },
            }
          }
        />
      </PageTransition>
    </>
  );
}
