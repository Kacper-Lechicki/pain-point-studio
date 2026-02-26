'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { HeroHighlight } from '@/components/ui/hero-highlight';
import { ROUTES } from '@/config/routes';
import { OverviewCompletionRing } from '@/features/projects/components/overview-completion-ring';
import { OverviewMetrics } from '@/features/projects/components/overview-metrics';
import { OverviewRecentActivity } from '@/features/projects/components/overview-recent-activity';
import { OverviewResponseTimeline } from '@/features/projects/components/overview-response-timeline';
import { OverviewSurveyStatusChart } from '@/features/projects/components/overview-survey-status-chart';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { Project, ProjectOverviewStats } from '@/features/projects/types';
import Link from '@/i18n/link';

interface ProjectOverviewTabProps {
  project: Project;
  overviewStats: ProjectOverviewStats;
}

export function ProjectOverviewTab({ project, overviewStats }: ProjectOverviewTabProps) {
  const t = useTranslations();
  const isArchived = isProjectArchived(project);

  const hasData = overviewStats.totalResponses > 0;

  return (
    <div className="flex flex-col gap-6">
      <OverviewMetrics stats={overviewStats} />

      {hasData ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <OverviewResponseTimeline data={overviewStats.responsesTimeline} />
            <OverviewSurveyStatusChart data={overviewStats.surveyStatusDistribution} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <OverviewCompletionRing data={overviewStats.completionBreakdown} />
            <OverviewRecentActivity items={overviewStats.recentActivity} />
          </div>
        </>
      ) : (
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
                <Link href={`${ROUTES.dashboard.researchNew}?projectId=${project.id}`}>
                  <Plus className="size-4" aria-hidden />
                  {t('projects.detail.createSurvey')}
                </Link>
              </Button>
            )}
          </div>
        </HeroHighlight>
      )}
    </div>
  );
}
