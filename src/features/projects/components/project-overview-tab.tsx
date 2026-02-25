'use client';

import { Lightbulb, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HeroHighlight } from '@/components/ui/hero-highlight';
import { ROUTES } from '@/config/routes';
import type { ProjectSurvey } from '@/features/projects/actions/get-project';
import { ProjectScorecard } from '@/features/projects/components/project-scorecard';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { Project, ProjectInsight } from '@/features/projects/types';
import Link from '@/i18n/link';

interface ProjectOverviewTabProps {
  project: Project;
  surveys: ProjectSurvey[];
  scorecardInsights: ProjectInsight[];
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
  onNavigateToSurveys: () => void;
}

export function ProjectOverviewTab({
  project,
  surveys,
  scorecardInsights,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
}: ProjectOverviewTabProps) {
  const t = useTranslations();
  const isArchived = isProjectArchived(project);

  const hasScorecard = scorecardInsights.length > 0;

  const isEmpty = surveys.length === 0 && scorecardInsights.length === 0;

  if (isEmpty) {
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
              <Link href={`${ROUTES.dashboard.researchNew}?projectId=${project.id}`}>
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
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ProjectScorecard
          projectId={project.id}
          insights={scorecardInsights}
          onInsightCreated={onInsightCreated}
          onInsightUpdated={onInsightUpdated}
          onInsightDeleted={onInsightDeleted}
        />

        {!hasScorecard && (
          <HeroHighlight
            showDotsOnMobile={false}
            containerClassName="w-full rounded-lg border border-dashed border-border"
          >
            <div className="flex w-full flex-col items-center px-4 py-10 text-center">
              <Lightbulb className="text-muted-foreground size-8" aria-hidden />
              <p className="text-muted-foreground mt-2 max-w-xs text-sm">
                {t('projects.detail.empty.noInsights')}
              </p>
            </div>
          </HeroHighlight>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {!isArchived && (
          <Card className="p-4">
            <h3 className="text-foreground text-sm font-medium">
              {t('projects.detail.quickActions.title')}
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href={`${ROUTES.dashboard.researchNew}?projectId=${project.id}`}>
                  <Plus className="size-4" aria-hidden />
                  {t('projects.detail.quickActions.createSurvey')}
                </Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
