'use client';

import { useMemo } from 'react';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { HeroHighlight } from '@/components/ui/hero-highlight';
import { OverviewActivityList } from '@/features/projects/components/overview-activity-list';
import { OverviewMetricCompletion } from '@/features/projects/components/overview-metric-completion';
import { OverviewMetricResponses } from '@/features/projects/components/overview-metric-responses';
import { OverviewMetricSurveys } from '@/features/projects/components/overview-metric-surveys';
import { OverviewResponseTrend } from '@/features/projects/components/overview-response-trend';
import { OverviewSurveyBreakdown } from '@/features/projects/components/overview-survey-breakdown';
import { OverviewVerdictCard } from '@/features/projects/components/overview-verdict-card';
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

  const currentPhase = useMemo(
    () => deriveProjectPhase(surveys.map((s) => ({ researchPhase: s.researchPhase }))),
    [surveys]
  );

  const verdict = useMemo(
    () =>
      computeVerdict({
        totalResponses: overviewStats.totalResponses,
        targetResponses: project.target_responses,
        insightCount: insights.length,
        findings: [],
        insights,
      }),
    [overviewStats.totalResponses, project.target_responses, insights]
  );

  // ── Empty state — no surveys yet ────────────────────────────────────

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

  // ── Data-centric layout ───────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Row 1: Metric Cards — 3 cols desktop, 2+1 mobile */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <OverviewMetricResponses
          totalResponses={overviewStats.totalResponses}
          timeline={overviewStats.responsesTimeline}
        />
        <OverviewMetricSurveys
          totalSurveys={overviewStats.totalSurveys}
          distribution={overviewStats.surveyStatusDistribution}
        />
        <div className="col-span-2 lg:col-span-1">
          <OverviewMetricCompletion
            avgCompletion={overviewStats.avgCompletion}
            breakdown={overviewStats.completionBreakdown}
          />
        </div>
      </div>

      {/* Row 2: Response Trend — full width */}
      <OverviewResponseTrend timeline={overviewStats.responsesTimeline} />

      {/* Row 3: Survey Breakdown + Verdict — 60/40 on desktop */}
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <OverviewSurveyBreakdown
          surveys={surveys}
          targetResponses={project.target_responses}
          projectId={project.id}
          isArchived={isArchived}
        />
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
      </div>

      {/* Row 4: Activity Feed — full width */}
      <OverviewActivityList items={overviewStats.recentActivity} />
    </div>
  );
}
