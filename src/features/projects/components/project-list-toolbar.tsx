'use client';

import { useTranslations } from 'next-intl';

import type { FilterGroup } from '@/components/ui/list-toolbar';
import { ListToolbar } from '@/components/ui/list-toolbar';
import type { MessageKey } from '@/i18n/types';
import { sortOptionsAlphabetically } from '@/lib/common/sort-options';

export type ProjectStatusFilter = 'active' | 'completed' | 'archived' | 'trashed';
export type ProjectSortBy =
  | 'updated'
  | 'created'
  | 'name'
  | 'surveys'
  | 'responses'
  | 'status'
  | 'activity';

const STATUS_OPTIONS: ProjectStatusFilter[] = ['active', 'completed', 'archived', 'trashed'];

const SORT_OPTIONS: ProjectSortBy[] = [
  'name',
  'surveys',
  'responses',
  'status',
  'activity',
  'updated',
  'created',
];

interface ProjectListToolbarProps {
  statusFilter: ProjectStatusFilter[];
  onStatusFilterChange: (filter: ProjectStatusFilter[]) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortBy: ProjectSortBy;
  sortDir: 'asc' | 'desc';
  onSortByChange: (sort: ProjectSortBy) => void;
  onSortDirChange: (dir: 'asc' | 'desc') => void;
  statusCounts: Record<string, number>;
}

export function ProjectListToolbar({
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirChange,
  statusCounts,
}: ProjectListToolbarProps) {
  const t = useTranslations();

  const statusGroup: FilterGroup = {
    label: t('projects.list.filters.statusSection'),
    options: sortOptionsAlphabetically(
      STATUS_OPTIONS.map((s) => ({
        value: s,
        label: t(`projects.list.status.${s}` as MessageKey),
        count: statusCounts[s] ?? 0,
      }))
    ),
    selected: statusFilter,
    onChange: onStatusFilterChange as (selected: string[]) => void,
  };

  const filterGroups: FilterGroup[] = [statusGroup];

  const sortOptions = sortOptionsAlphabetically(
    SORT_OPTIONS.map((v) => ({
      value: v,
      label: t(`projects.list.sort.${v}` as MessageKey),
    }))
  );

  return (
    <ListToolbar<ProjectSortBy>
      searchQuery={searchQuery}
      onSearchQueryChange={onSearchQueryChange}
      searchPlaceholder={t('projects.list.search.placeholder')}
      filterGroups={filterGroups}
      filterLabel={t('projects.list.filters.label')}
      clearFiltersLabel={t('projects.list.filters.clearFilters')}
      sortBy={sortBy}
      sortDir={sortDir}
      onSortByChange={onSortByChange}
      onSortDirChange={onSortDirChange}
      sortOptions={sortOptions}
      sortDirLabels={{
        asc: t('projects.list.sort.asc'),
        desc: t('projects.list.sort.desc'),
      }}
      sortLabel={t(`projects.list.sort.${sortBy}` as MessageKey)}
    />
  );
}
