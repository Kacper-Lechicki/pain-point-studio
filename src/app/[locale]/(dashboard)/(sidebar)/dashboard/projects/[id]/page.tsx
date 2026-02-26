import { notFound } from 'next/navigation';

import { PageTransition } from '@/components/ui/page-transition';
import { getProject } from '@/features/projects/actions/get-project';
import { getProjectInsights } from '@/features/projects/actions/get-project-insights';
import { getProjectOverviewStats } from '@/features/projects/actions/get-project-overview-stats';
import { getProjectSignalsData } from '@/features/projects/actions/get-project-signals-data';
import { ProjectDashboardPage } from '@/features/projects/components/project-dashboard-page';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const [data, signalsData, insights, overviewStats] = await Promise.all([
    getProject(id),
    getProjectSignalsData(id),
    getProjectInsights(id),
    getProjectOverviewStats(id),
  ]);

  if (!data) {
    notFound();
  }

  return (
    <PageTransition>
      <ProjectDashboardPage
        project={data.project}
        surveys={data.surveys}
        signalsData={signalsData}
        insights={insights}
        overviewStats={
          overviewStats ?? {
            totalSurveys: 0,
            activeSurveys: 0,
            totalResponses: 0,
            avgCompletion: 0,
            avgTimeSeconds: null,
            lastResponseAt: null,
            responsesTimeline: [],
            surveyStatusDistribution: {},
            completionBreakdown: { completed: 0, inProgress: 0, abandoned: 0 },
            recentActivity: [],
          }
        }
      />
    </PageTransition>
  );
}
