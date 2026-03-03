'use client';

import { useMemo, useState } from 'react';

import { ClipboardList, Expand, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricRow, SectionLabel } from '@/components/ui/metric-display';
import { SearchInput } from '@/components/ui/search-input';
import { Separator } from '@/components/ui/separator';
import type { ProjectDetail } from '@/features/projects/actions/get-project';
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import { ProjectActionButtons } from '@/features/projects/components/project-action-buttons';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import {
  CompactSurveyList,
  SurveysListSkeleton,
} from '@/features/projects/components/project-survey-list';
import type { ProjectAction } from '@/features/projects/config/status';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';
import type { ProjectStatus } from '@/features/projects/types';
import Link from '@/i18n/link';

interface ProjectDetailPanelProps {
  project: ProjectWithMetrics;
  projectDetail: ProjectDetail | null;
  onEdit: () => void;
  onAction: (action: ProjectAction) => void;
}

export function ProjectDetailPanel({
  project,
  projectDetail,
  onEdit,
  onAction,
}: ProjectDetailPanelProps) {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const isSearching = searchQuery.trim().length > 0;
  const allSurveys = projectDetail?.surveys ?? null;

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
          aria-label={t('projects.detail.openInFullPage')}
          asChild
        >
          <Link href={getProjectDetailUrl(project.id)}>
            <Expand className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>

      {project.summary && (
        <p className="text-muted-foreground mt-2.5 line-clamp-3 text-xs leading-relaxed">
          {project.summary}
        </p>
      )}

      <Separator className="my-4" />

      <SectionLabel>{t('projects.detail.detailsLabel')}</SectionLabel>
      <div className="flex flex-col gap-2">
        <MetricRow
          label={t('projects.detail.status')}
          value={<ProjectStatusBadge status={project.status as ProjectStatus} />}
        />

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
        status={project.status as ProjectStatus}
        onEdit={onEdit}
        onAction={onAction}
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
        <EmptyState
          variant="compact"
          icon={ClipboardList}
          title={t('projects.detail.noSurveys')}
          description={t('projects.detail.noSurveysDescription')}
          action={
            <Button variant="default" size="sm" className="h-7 text-xs" asChild>
              <Link href={`${getProjectDetailUrl(project.id)}?tab=surveys`}>
                <Plus className="size-3.5" aria-hidden />
                {t('projects.detail.createSurvey')}
              </Link>
            </Button>
          }
        />
      ) : (
        <CompactSurveyList surveys={filteredSurveys ?? []} isSearching={isSearching} />
      )}
    </div>
  );
}
