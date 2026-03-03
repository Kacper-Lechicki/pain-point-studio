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

const EMPTY_OVERVIEW_STATS = {
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
};

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;

  // Critical queries — page can't render without these
  const [data, t] = await Promise.all([getProject(id), getTranslations()]);

  if (!data) {
    notFound();
  }

  // Non-critical queries — page degrades gracefully on failure
  const [insightsResult, statsResult, surveysResult, notesResult, foldersResult] =
    await Promise.allSettled([
      getProjectInsights(id),
      getProjectOverviewStats(id),
      getProjectSurveys(id),
      getProjectNotes(id),
      getNoteFolders(id),
    ]);

  return (
    <>
      <DashboardPageBack href={ROUTES.dashboard.projects} label={t('common.backToProjects')} />

      <PageTransition>
        <ProjectDashboardPage
          project={data.project}
          owner={data.owner}
          surveys={settled(surveysResult, []) ?? []}
          insights={settled(insightsResult, []) ?? []}
          notesMeta={settled(notesResult, []) ?? []}
          noteFolders={settled(foldersResult, []) ?? []}
          overviewStats={settled(statsResult, null) ?? EMPTY_OVERVIEW_STATS}
        />
      </PageTransition>
    </>
  );
}
