'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { HeroHighlight } from '@/components/ui/hero-highlight';
import { OverviewActivityList } from '@/features/projects/components/overview-activity-list';
import { OverviewResponseTrend } from '@/features/projects/components/overview-response-trend';
import { OverviewVerdictCard } from '@/features/projects/components/overview-verdict-card';
import { ProjectAboutCard } from '@/features/projects/components/project-about-card';
import { ProjectOverviewKpiCards } from '@/features/projects/components/project-overview-kpi-cards';
import { deriveProjectPhase, isProjectArchived } from '@/features/projects/lib/project-helpers';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';
import { computeVerdict } from '@/features/projects/lib/verdict';
import type { Project, ProjectInsight, ProjectOverviewStats } from '@/features/projects/types';
import type { UserSurvey } from '@/features/surveys/actions';
import Link from '@/i18n/link';

interface ProjectOverviewTabProps {
  project: Project;
  surveys: UserSurvey[];
  insights: ProjectInsight[];
  overviewStats: ProjectOverviewStats;
}

export function ProjectOverviewTab({
  project,
  surveys,
  insights,
  overviewStats,
}: ProjectOverviewTabProps) {
  const t = useTranslations();
  const isArchived = isProjectArchived(project);
  const hasSurveys = overviewStats.totalSurveys > 0;

  const currentPhase = deriveProjectPhase(surveys.map((s) => ({ researchPhase: s.researchPhase })));

  const verdict = computeVerdict({
    totalResponses: overviewStats.totalResponses,
    targetResponses: project.target_responses,
    insightCount: insights.length,
    findings: [],
    insights,
  });

  if (!hasSurveys) {
    return (
      <HeroHighlight
        showDotsOnMobile={false}
        containerClassName="w-full rounded-lg border border-dashed border-border"
      >
        <div className="flex w-full flex-col items-center px-4 py-12 text-center md:py-16">
          <p className="text-foreground text-base font-medium">
            {t('projects.detail.empty.title')}
          </p>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            {t('projects.detail.empty.description')}
          </p>
          {!isArchived && (
            <Button className="mt-4" asChild>
              <Link href={`${getProjectDetailUrl(project.id)}?tab=surveys`}>
                <Plus className="size-4" aria-hidden />
                {t('projects.detail.createSurvey')}
              </Link>
            </Button>
          )}
        </div>
      </HeroHighlight>
    );
  }

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="min-w-0">
        <ProjectAboutCard project={project} />
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <OverviewVerdictCard
          verdict={verdict}
          totalResponses={overviewStats.totalResponses}
          targetResponses={project.target_responses}
          projectId={project.id}
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
