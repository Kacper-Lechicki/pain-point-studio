'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import type { OverviewProject } from '@/features/dashboard/actions/get-dashboard-overview';
import { deriveCurrentPhase, deriveVerdictStatus } from '@/features/dashboard/lib/project-verdict';
import { RESEARCH_PHASE_CONFIG } from '@/features/projects/config/contexts';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';
import type { ProjectContext } from '@/features/projects/types';
import Link from '@/i18n/link';
import type { MessageKey } from '@/i18n/types';

import { PhaseProgressBar } from './phase-progress-bar';
import { VerdictBadge } from './verdict-badge';

interface DashboardProjectCardProps {
  project: OverviewProject;
}

export function DashboardProjectCard({ project }: DashboardProjectCardProps) {
  const t = useTranslations();
  const format = useFormatter();
  const isIdeaValidation = (project.context as ProjectContext) === 'idea_validation';
  const updatedAtLabel = format.relativeTime(new Date(project.updatedAt), new Date());

  const currentPhase = deriveCurrentPhase(project.phaseStatuses);
  const verdictStatus = deriveVerdictStatus(project.phaseStatuses);

  const currentPhaseConfig = currentPhase ? RESEARCH_PHASE_CONFIG[currentPhase] : null;
  const currentPhaseMetrics =
    currentPhase && project.phaseMetrics ? project.phaseMetrics[currentPhase] : null;

  return (
    <Link
      href={getProjectDetailUrl(project.id)}
      className="border-border/50 hover:border-border hover:bg-muted/30 flex min-w-0 flex-col rounded-lg border p-4 transition-colors"
    >
      {/* ── Zone 1: Identity ──────────────────────────────────────────── */}
      <div className="min-w-0">
        <span className="text-foreground block truncate text-sm font-semibold">{project.name}</span>

        {project.description && (
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{project.description}</p>
        )}
      </div>

      {/* ── Zone 2: Progress / Context ────────────────────────────────── */}
      <div className="mt-4">
        {isIdeaValidation && project.phaseStatuses ? (
          <>
            <PhaseProgressBar phaseStatuses={project.phaseStatuses} />

            {currentPhaseConfig && currentPhaseMetrics && (
              <p className="text-muted-foreground mt-2 text-xs">
                <span className="text-foreground font-medium">
                  {t(currentPhaseConfig.labelKey as MessageKey)}
                </span>
                {' · '}
                {t('dashboard.overview.projectCard.surveys', {
                  count: currentPhaseMetrics.surveyCount,
                })}
                {', '}
                {t('dashboard.overview.projectCard.responses', {
                  count: currentPhaseMetrics.responseCount,
                })}
              </p>
            )}
          </>
        ) : (
          <>
            <Badge variant="secondary" className="text-xs">
              {t('projects.contexts.customResearch')}
            </Badge>

            <p className="text-muted-foreground mt-1.5 text-xs">
              {t('dashboard.overview.projectCard.surveys', { count: project.surveyCount })}
              {' · '}
              {t('dashboard.overview.projectCard.responses', { count: project.responseCount })}
            </p>
          </>
        )}
      </div>

      {/* ── Zone 3: Footer ────────────────────────────────────────────── */}
      <div className="border-border/50 mt-4 flex items-center justify-between gap-2 border-t pt-3">
        {verdictStatus ? (
          <VerdictBadge status={verdictStatus} />
        ) : (
          <span className="text-muted-foreground text-xs">
            {t('dashboard.overview.projectCard.surveys', { count: project.surveyCount })}
          </span>
        )}

        <span className="text-muted-foreground shrink-0 text-xs">{updatedAtLabel}</span>
      </div>
    </Link>
  );
}
