'use client';

import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import type { FilterGroup, FilterOption } from '@/components/ui/list-toolbar';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { sortOptionsAlphabetically } from '@/lib/common/sort-options';

export type SurveyStatusFilter =
  | 'active'
  | 'draft'
  | 'completed'
  | 'cancelled'
  | 'archived'
  | 'trashed';
export type SurveySortBy =
  | 'updated'
  | 'created'
  | 'responses'
  | 'title'
  | 'status'
  | 'completion'
  | 'lastResponse'
  | 'activity';

export type SurveySortDir = 'asc' | 'desc';

export interface ProjectFilterOption {
  id: string;
  name: string;
  count: number;
}

/** Sentinel value for the "No project" filter option. */
export const NO_PROJECT_FILTER_ID = '__none__';

interface SurveyListToolbarProps {
  statusFilter: SurveyStatusFilter[];
  onStatusFilterChange: (filter: SurveyStatusFilter[]) => void;
  projectFilter: string[];
  onProjectFilterChange: (projectIds: string[]) => void;
  projectOptions: ProjectFilterOption[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortBy: SurveySortBy;
  sortDir: SurveySortDir;
  onSortByChange: (sort: SurveySortBy) => void;
  onSortDirChange: (dir: SurveySortDir) => void;
  statusCounts: Record<string, number>;
  /** Hide the project filter group (used in project context where all surveys belong to one project). */
  hideProjectFilter?: boolean;
  /** Extra content rendered after the sort dropdown (e.g. action buttons). */
  actions?: ReactNode | undefined;
}

const STATUS_OPTIONS: SurveyStatusFilter[] = [
  'active',
  'draft',
  'completed',
  'cancelled',
  'trashed',
];
const STATUS_OPTIONS_WITH_ARCHIVED: SurveyStatusFilter[] = [
  'active',
  'draft',
  'completed',
  'cancelled',
  'archived',
  'trashed',
];

const SORT_OPTIONS: SurveySortBy[] = [
  'title',
  'status',
  'completion',
  'responses',
  'lastResponse',
  'activity',
  'updated',
  'created',
];

export const SurveyListToolbar = ({
  statusFilter,
  onStatusFilterChange,
  projectFilter,
  onProjectFilterChange,
  projectOptions,
  searchQuery,
  onSearchQueryChange,
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirChange,
  statusCounts,
  hideProjectFilter,
  actions,
}: SurveyListToolbarProps) => {
  const t = useTranslations();

  const effectiveStatusOptions = hideProjectFilter ? STATUS_OPTIONS_WITH_ARCHIVED : STATUS_OPTIONS;

  const statusGroup: FilterGroup = {
    label: t('surveys.dashboard.filters.statusSection'),
    options: sortOptionsAlphabetically(
      effectiveStatusOptions.map((s) => ({
        value: s,
        label: t(`surveys.dashboard.filters.${s}`),
        count: statusCounts[s] ?? 0,
      }))
    ),
    selected: statusFilter,
    onChange: onStatusFilterChange as (selected: string[]) => void,
  };

  const filterGroups: FilterGroup[] = [statusGroup];

  if (!hideProjectFilter) {
    // Build project filter options: named projects + "No project" sentinel
    const noProjectCount = projectOptions.find((p) => p.id === NO_PROJECT_FILTER_ID)?.count ?? 0;

    const projectFilterOptions: FilterOption[] = sortOptionsAlphabetically(
      projectOptions
        .filter((p) => p.id !== NO_PROJECT_FILTER_ID)
        .map((p) => ({ value: p.id, label: p.name, count: p.count }))
    );

    if (noProjectCount > 0) {
      projectFilterOptions.push({
        value: NO_PROJECT_FILTER_ID,
        label: t('surveys.dashboard.filters.noProject'),
        count: noProjectCount,
        labelClassName: 'text-muted-foreground italic',
      });
    }

    if (projectFilterOptions.length > 0) {
      filterGroups.push({
        label: t('surveys.dashboard.filters.projectSection'),
        options: projectFilterOptions,
        selected: projectFilter,
        onChange: onProjectFilterChange,
      });
    }
  }

  const sortOptions = sortOptionsAlphabetically(
    SORT_OPTIONS.map((v) => ({ value: v, label: t(`surveys.dashboard.sort.${v}`) }))
  );

  return (
    <ListToolbar<SurveySortBy>
      searchQuery={searchQuery}
      onSearchQueryChange={onSearchQueryChange}
      searchPlaceholder={t('surveys.dashboard.search.placeholder')}
      filterGroups={filterGroups}
      filterLabel={t('surveys.dashboard.filters.label')}
      clearFiltersLabel={t('surveys.dashboard.filters.clearFilters')}
      sortBy={sortBy}
      sortDir={sortDir}
      onSortByChange={onSortByChange}
      onSortDirChange={onSortDirChange}
      sortOptions={sortOptions}
      sortDirLabels={{
        asc: t('surveys.dashboard.sort.asc'),
        desc: t('surveys.dashboard.sort.desc'),
      }}
      sortLabel={t(`surveys.dashboard.sort.${sortBy}`)}
      actions={actions}
    />
  );
};
