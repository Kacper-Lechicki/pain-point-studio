'use client';

import { useMemo } from 'react';

import { ClipboardList, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type { SurveySignalData } from '@/features/projects/actions/get-project-signals-data';
import { OverviewActivityList } from '@/features/projects/components/overview-activity-list';
import { OverviewResponseTrend } from '@/features/projects/components/overview-response-trend';
import { OverviewVerdictCard } from '@/features/projects/components/overview-verdict-card';
import { ProjectAboutCard } from '@/features/projects/components/project-about-card';
import { ProjectOverviewKpiCards } from '@/features/projects/components/project-overview-kpi-cards';
import { deriveProjectPhase, isProjectArchived } from '@/features/projects/lib/project-helpers';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';
import { generateFindings } from '@/features/projects/lib/signals';
import { computeVerdict } from '@/features/projects/lib/verdict';
import type { Project, ProjectInsight, ProjectOverviewStats } from '@/features/projects/types';
import type { UserSurvey } from '@/features/surveys/actions';
import Link from '@/i18n/link';

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
  const t = useTranslations();
  const isArchived = isProjectArchived(project);
  const hasSurveys = overviewStats.totalSurveys > 0;

  const currentPhase = deriveProjectPhase(surveys.map((s) => ({ researchPhase: s.researchPhase })));

  const findings = useMemo(() => generateFindings(signalsData), [signalsData]);

  const verdict = computeVerdict({
    totalResponses: overviewStats.totalResponses,
    targetResponses: project.target_responses,
    insightCount: insights.length,
    findings,
    insights,
  });

  if (!hasSurveys) {
    return (
      <EmptyState
        icon={ClipboardList}
        title={t('projects.detail.empty.title')}
        description={t('projects.detail.empty.description')}
        accent="cyan"
        action={
          !isArchived ? (
            <Button asChild>
              <Link href={`${getProjectDetailUrl(project.id)}?tab=surveys`}>
                <Plus className="size-4" aria-hidden />
                {t('projects.detail.createSurvey')}
              </Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="order-2 min-w-0 lg:order-none">
        <ProjectAboutCard project={project} />
      </div>

      <div className="order-1 flex min-w-0 flex-col gap-4 lg:order-none">
        <OverviewVerdictCard
          verdict={verdict}
          totalResponses={overviewStats.totalResponses}
          targetResponses={project.target_responses}
          currentPhase={currentPhase}
          activeSurveys={overviewStats.activeSurveys}
          totalSurveys={overviewStats.totalSurveys}
          insightCount={insights.length}
          isArchived={isArchived}
        />
        <ProjectOverviewKpiCards
          overviewStats={overviewStats}
          targetResponses={project.target_responses}
        />
        <OverviewResponseTrend timeline={overviewStats.responsesTimeline} />
        <OverviewActivityList items={overviewStats.recentActivity} />
      </div>
    </div>
  );
}
