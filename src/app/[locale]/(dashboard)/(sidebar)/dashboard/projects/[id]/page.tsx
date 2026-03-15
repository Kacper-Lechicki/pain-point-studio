import { notFound } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { DashboardPageBack } from '@/features/dashboard/components/layout/dashboard-page-back';
import {
  type InsightSuggestionsResult,
  getInsightSuggestions,
} from '@/features/projects/actions/get-insight-suggestions';
import { getNoteFolders } from '@/features/projects/actions/get-note-folders';
import { getPendingInsightSurveys } from '@/features/projects/actions/get-pending-insight-surveys';
import { getProject } from '@/features/projects/actions/get-project';
import { getProjectInsights } from '@/features/projects/actions/get-project-insights';
import { getProjectNotes } from '@/features/projects/actions/get-project-notes';
import { getProjectOverviewStats } from '@/features/projects/actions/get-project-overview-stats';
import { getProjectSignalsData } from '@/features/projects/actions/get-project-signals-data';
import { ProjectDashboardPage } from '@/features/projects/components/project-dashboard-page';
import { getProjectSurveys } from '@/features/surveys/actions';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const [data, t] = await Promise.all([getProject(id), getTranslations()]);

  if (!data) {
    return { title: t('metadata.title') };
  }

  return {
    title: `${t('metadata.pages.project', { name: data.project.name })} | ${t('metadata.title')}`,
  };
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
  surveyStatusDistribution: { draft: 0, active: 0, completed: 0, cancelled: 0, archived: 0 },
  completionBreakdown: { completed: 0, inProgress: 0, abandoned: 0 },
};

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;

  const [data, t] = await Promise.all([getProject(id), getTranslations()]);

  if (!data) {
    notFound();
  }

  const EMPTY_SUGGESTIONS: InsightSuggestionsResult = {
    suggestions: [],
    totalCompletedResponses: 0,
  };

  const [
    insightsResult,
    statsResult,
    surveysResult,
    notesResult,
    foldersResult,
    signalsResult,
    suggestionsResult,
    pendingResult,
  ] = await Promise.allSettled([
    getProjectInsights(id),
    getProjectOverviewStats(id),
    getProjectSurveys(id),
    getProjectNotes(id),
    getNoteFolders(id),
    getProjectSignalsData(id),
    getInsightSuggestions(id),
    getPendingInsightSurveys(id),
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
          signalsData={settled(signalsResult, [])}
          suggestionsData={settled(suggestionsResult, EMPTY_SUGGESTIONS)}
          pendingSurveys={settled(pendingResult, [])}
        />
      </PageTransition>
    </>
  );
}
