'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CompletionBarChart } from '@/components/charts/completion-bar-chart';
import { Button } from '@/components/ui/button';
import { HeroHighlight } from '@/components/ui/hero-highlight';
import { SectionLabel } from '@/components/ui/metric-display';
import { Separator } from '@/components/ui/separator';
import { OverviewMetrics } from '@/features/projects/components/overview-metrics';
import { OverviewRecentActivity } from '@/features/projects/components/overview-recent-activity';
import { OverviewResponseTimeline } from '@/features/projects/components/overview-response-timeline';
import { ProjectDetailInfo } from '@/features/projects/components/project-detail-info';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';
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

      <Separator />

      <ProjectDetailInfo project={project} />

      <Separator />

      {hasData ? (
        <>
          <OverviewResponseTimeline data={overviewStats.responsesTimeline} />

          <div>
            <SectionLabel>{t('projects.detail.charts.completionRate')}</SectionLabel>
            <CompletionBarChart
              data={overviewStats.completionBreakdown}
              noDataMessage={t('projects.detail.charts.noData')}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                <Link href={`${getProjectDetailUrl(project.id)}?tab=surveys`}>
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
