'use client';

import { useMemo } from 'react';

import dynamic from 'next/dynamic';

import type { SurveySignalData } from '@/features/projects/actions/get-project-signals-data';
import { OverviewActivityList } from '@/features/projects/components/overview-activity-list';
import { OverviewVerdictCard } from '@/features/projects/components/overview-verdict-card';
import { ProjectAboutCard } from '@/features/projects/components/project-about-card';
import { ProjectOverviewKpiCards } from '@/features/projects/components/project-overview-kpi-cards';
import { deriveProjectPhase, isProjectArchived } from '@/features/projects/lib/project-helpers';
import { generateFindings } from '@/features/projects/lib/signals';
import { computeVerdict } from '@/features/projects/lib/verdict';
import type { Project, ProjectInsight, ProjectOverviewStats } from '@/features/projects/types';
import type { UserSurvey } from '@/features/surveys/types';

const OverviewResponseTrend = dynamic(
  () =>
    import('@/features/projects/components/overview-response-trend').then(
      (mod) => mod.OverviewResponseTrend
    ),
  {
    loading: () => <div className="bg-card h-[280px] animate-pulse rounded-lg border" />,
  }
);

interface ProjectOverviewTabProps {
  project: Project;
  surveys: UserSurvey[];
  insights: ProjectInsight[];
  overviewStats: ProjectOverviewStats;
  signalsData: SurveySignalData[];
}

export function ProjectOverviewTab({
  project,
  surveys,
  insights,
  overviewStats,
  signalsData,
}: ProjectOverviewTabProps) {
  const isArchived = isProjectArchived(project);

  const currentPhase = deriveProjectPhase(surveys.map((s) => ({ researchPhase: s.researchPhase })));

  const findings = useMemo(() => generateFindings(signalsData), [signalsData]);

  const verdict = computeVerdict({
    totalResponses: overviewStats.totalResponses,
    responseLimit: project.response_limit,
    insightCount: insights.length,
    findings,
    insights,
  });

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="order-2 min-w-0 lg:order-none">
        <ProjectAboutCard project={project} />
      </div>

      <div className="order-1 flex min-w-0 flex-col gap-4 lg:order-none">
        <OverviewVerdictCard
          verdict={verdict}
          totalResponses={overviewStats.totalResponses}
          responseLimit={project.response_limit}
          currentPhase={currentPhase}
          activeSurveys={overviewStats.activeSurveys}
          totalSurveys={overviewStats.totalSurveys}
          insightCount={insights.length}
          isArchived={isArchived}
        />
        <ProjectOverviewKpiCards
          overviewStats={overviewStats}
          responseLimit={project.response_limit}
        />
        <OverviewResponseTrend timeline={overviewStats.responsesTimeline} />
        <OverviewActivityList items={overviewStats.recentActivity} />
      </div>
    </div>
  );
}
