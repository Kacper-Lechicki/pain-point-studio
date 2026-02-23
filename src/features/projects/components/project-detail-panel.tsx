'use client';

import { useMemo, useState } from 'react';

import { Expand, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { MetricRow, SectionLabel } from '@/components/ui/metric-display';
import { SearchInput } from '@/components/ui/search-input';
import { Separator } from '@/components/ui/separator';
import { ROUTES } from '@/config/routes';
import type { ProjectDetail, ProjectSurvey } from '@/features/projects/actions/get-project';
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import { ProjectActionButtons } from '@/features/projects/components/project-action-buttons';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import {
  CompactPhaseGroup,
  CompactSurveyList,
  SurveysListSkeleton,
} from '@/features/projects/components/project-survey-list';
import { ValidationProgressDots } from '@/features/projects/components/validation-progress-dots';
import { PROJECT_CONTEXTS_CONFIG } from '@/features/projects/config/contexts';
import { computePhaseStatuses } from '@/features/projects/lib/phase-status';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';
import type { ProjectContext, ProjectStatus } from '@/features/projects/types';
import Link from '@/i18n/link';
import type { MessageKey } from '@/i18n/types';

interface ProjectDetailPanelProps {
  project: ProjectWithMetrics;
  projectDetail: ProjectDetail | null;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function ProjectDetailPanel({
  project,
  projectDetail,
  onEdit,
  onArchive,
  onDelete,
}: ProjectDetailPanelProps) {
  const t = useTranslations();
  const isArchived = isProjectArchived(project);
  const contextConfig = PROJECT_CONTEXTS_CONFIG[project.context as ProjectContext];
  const isIdeaValidation = project.context === 'idea_validation';
  const [searchQuery, setSearchQuery] = useState('');
  const isSearching = searchQuery.trim().length > 0;
  const allSurveys = projectDetail?.surveys ?? null;
  const surveysByPhase = projectDetail?.surveysByPhase ?? null;

  const statusCounts = useMemo(() => {
    if (!allSurveys) {
      return null;
    }

    let active = 0;
    let completed = 0;
    let draft = 0;

    for (const s of allSurveys) {
      if (s.status === 'active') {
        active++;
      } else if (s.status === 'completed') {
        completed++;
      } else if (s.status === 'draft') {
        draft++;
      }
    }

    return { active, completed, draft };
  }, [allSurveys]);

  const filteredSurveysByPhase = useMemo(() => {
    if (!surveysByPhase) {
      return null;
    }

    if (!isSearching) {
      return surveysByPhase;
    }

    const q = searchQuery.trim().toLowerCase();
    const result: Record<string, ProjectSurvey[]> = {};

    for (const [phase, phaseSurveys] of Object.entries(surveysByPhase)) {
      result[phase] = phaseSurveys.filter((s) => s.title.toLowerCase().includes(q));
    }

    return result;
  }, [surveysByPhase, searchQuery, isSearching]);

  const filteredSurveys = useMemo(() => {
    if (!allSurveys) {
      return null;
    }

    if (!isSearching) {
      return allSurveys;
    }

    const q = searchQuery.trim().toLowerCase();

    return allSurveys.filter((s) => s.title.toLowerCase().includes(q));
  }, [allSurveys, searchQuery, isSearching]);

  const phaseStatuses = useMemo(() => {
    if (!isIdeaValidation) {
      return null;
    }

    if (projectDetail?.surveysByPhase) {
      return computePhaseStatuses(projectDetail.surveysByPhase);
    }

    return project.phaseStatuses;
  }, [isIdeaValidation, projectDetail, project.phaseStatuses]);

  const showSearch = allSurveys !== null && allSurveys.length > 3;

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <h3 className="text-foreground min-w-0 flex-1 truncate text-base leading-snug font-semibold">
          {project.name}
        </h3>

        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground shrink-0"
          aria-label={t('surveys.dashboard.actions.openInFullPage')}
          asChild
        >
          <Link href={getProjectDetailUrl(project.id)}>
            <Expand className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>

      {project.description && (
        <p className="text-muted-foreground mt-2.5 line-clamp-3 text-xs leading-relaxed">
          {project.description}
        </p>
      )}

      <Separator className="my-4" />

      <SectionLabel>{t('projects.detail.detailsLabel')}</SectionLabel>
      <div className="flex flex-col gap-2">
        <MetricRow
          label={t('projects.detail.context')}
          value={t(contextConfig.labelKey as MessageKey)}
        />

        <MetricRow
          label={t('projects.detail.status')}
          value={<ProjectStatusBadge status={project.status as ProjectStatus} />}
        />

        {phaseStatuses && (
          <MetricRow
            label={t('projects.detail.progress')}
            value={<ValidationProgressDots phaseStatuses={phaseStatuses} />}
          />
        )}

        <MetricRow label={t('projects.detail.surveyCount')} value={project.surveyCount} />
        <MetricRow label={t('projects.detail.responseCount')} value={project.responseCount} />

        {statusCounts !== null && statusCounts.active > 0 && (
          <MetricRow label={t('projects.detail.activeSurveys')} value={statusCounts.active} />
        )}

        {statusCounts !== null && statusCounts.completed > 0 && (
          <MetricRow label={t('projects.detail.completedSurveys')} value={statusCounts.completed} />
        )}

        {statusCounts !== null && statusCounts.draft > 0 && (
          <MetricRow label={t('projects.detail.draftSurveys')} value={statusCounts.draft} />
        )}
      </div>

      <Separator className="my-4" />

      <ProjectActionButtons
        isArchived={isArchived}
        onEdit={onEdit}
        onArchive={onArchive}
        onDelete={onDelete}
      />

      <Separator className="my-4" />
      <SectionLabel>{t('projects.detail.surveysLabel')}</SectionLabel>

      {showSearch && (
        <div className="mb-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('projects.detail.searchPlaceholder')}
            size="sm"
          />
        </div>
      )}

      {allSurveys === null ? (
        <SurveysListSkeleton />
      ) : allSurveys.length === 0 ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-muted-foreground text-xs">{t('projects.detail.noSurveys')}</p>
          <Button variant="default" size="sm" className="h-7 text-xs" asChild>
            <Link href={ROUTES.dashboard.researchNew}>
              <Plus className="size-3.5" aria-hidden />
              {t('projects.detail.createSurvey')}
            </Link>
          </Button>
        </div>
      ) : isIdeaValidation && surveysByPhase && filteredSurveysByPhase ? (
        <div className="flex flex-col gap-4">
          {contextConfig.phases.map((phase) => {
            const phaseSurveys = filteredSurveysByPhase[phase.value] ?? [];
            const totalCount = (surveysByPhase[phase.value] ?? []).length;

            if (!isSearching && totalCount === 0) {
              return null;
            }

            if (isSearching && phaseSurveys.length === 0 && totalCount === 0) {
              return null;
            }

            return (
              <CompactPhaseGroup
                key={phase.value}
                phase={phase}
                surveys={phaseSurveys}
                totalCount={totalCount}
                isSearching={isSearching}
              />
            );
          })}

          {(surveysByPhase['unassigned']?.length ?? 0) > 0 && (
            <CompactPhaseGroup
              phase={null}
              surveys={filteredSurveysByPhase['unassigned'] ?? []}
              totalCount={(surveysByPhase['unassigned'] ?? []).length}
              isSearching={isSearching}
              label={t('projects.detail.unassigned')}
            />
          )}

          {isSearching && filteredSurveys !== null && filteredSurveys.length === 0 && (
            <p className="text-muted-foreground py-2 text-center text-xs">
              {t('projects.detail.noMatchingSurveys')}
            </p>
          )}
        </div>
      ) : (
        <CompactSurveyList surveys={filteredSurveys ?? []} isSearching={isSearching} />
      )}
    </div>
  );
}
