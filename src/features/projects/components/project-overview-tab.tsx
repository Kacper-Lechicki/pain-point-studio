'use client';

import { useMemo } from 'react';

import { ChevronRight, Lightbulb, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HeroHighlight } from '@/components/ui/hero-highlight';
import { ROUTES } from '@/config/routes';
import type { ProjectDetail, ProjectSurvey } from '@/features/projects/actions/get-project';
import { ProjectScorecard } from '@/features/projects/components/project-scorecard';
import { PROJECT_CONTEXTS_CONFIG } from '@/features/projects/config/contexts';
import { computePhaseStatuses } from '@/features/projects/lib/phase-status';
import type { PhaseStatus } from '@/features/projects/lib/phase-status';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { Project, ProjectInsight, ResearchPhase } from '@/features/projects/types';
import Link from '@/i18n/link';
import type { MessageKey } from '@/i18n/types';

interface ProjectOverviewTabProps {
  project: Project;
  surveys: ProjectSurvey[];
  surveysByPhase: ProjectDetail['surveysByPhase'];
  scorecardInsights: ProjectInsight[];
  isIdeaValidation: boolean;
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
  onNavigateToSurveys: () => void;
}

export function ProjectOverviewTab({
  project,
  surveys,
  surveysByPhase,
  scorecardInsights,
  isIdeaValidation,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
  onNavigateToSurveys,
}: ProjectOverviewTabProps) {
  const t = useTranslations();
  const isArchived = isProjectArchived(project);

  const phaseStatuses = useMemo(
    () => (isIdeaValidation ? computePhaseStatuses(surveysByPhase) : null),
    [isIdeaValidation, surveysByPhase]
  );

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

        {isIdeaValidation && phaseStatuses && (
          <Card className="p-4">
            <h3 className="text-foreground text-sm font-medium">
              {t('projects.detail.phaseCards.title')}
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              {PROJECT_CONTEXTS_CONFIG.idea_validation.phases.map((phase) => {
                const status = phaseStatuses[phase.value as ResearchPhase];
                const phaseSurveys = surveysByPhase[phase.value] ?? [];
                const responseCount = phaseSurveys.reduce((sum, s) => sum + s.responseCount, 0);

                return (
                  <PhaseProgressCard
                    key={phase.value}
                    labelKey={phase.labelKey}
                    status={status}
                    surveyCount={phaseSurveys.length}
                    responseCount={responseCount}
                    onClick={onNavigateToSurveys}
                  />
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Phase Progress Card ────────────────────────────────────────────

const STATUS_DOT: Record<PhaseStatus, string> = {
  validated: 'bg-emerald-500',
  in_progress: 'bg-amber-500',
  not_started: 'bg-muted-foreground/30',
};

interface PhaseProgressCardProps {
  labelKey: string;
  status: PhaseStatus;
  surveyCount: number;
  responseCount: number;
  onClick: () => void;
}

function PhaseProgressCard({
  labelKey,
  status,
  surveyCount,
  responseCount,
  onClick,
}: PhaseProgressCardProps) {
  const t = useTranslations();

  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:bg-muted/50 flex items-center gap-3 rounded-md px-2 py-2 text-left transition-colors"
    >
      <span className={`size-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} />

      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-medium">{t(labelKey as MessageKey)}</p>
        <p className="text-muted-foreground text-xs">
          {t('projects.detail.phaseCards.meta', {
            surveys: surveyCount,
            responses: responseCount,
          })}
        </p>
      </div>

      <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
    </button>
  );
}
