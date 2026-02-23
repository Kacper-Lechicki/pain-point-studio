'use client';

import { useTranslations } from 'next-intl';

import type { FilterGroup } from '@/components/ui/list-toolbar';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { PROJECT_CONTEXTS_CONFIG } from '@/features/projects/config/contexts';
import { PROJECT_CONTEXTS } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { sortOptionsAlphabetically } from '@/lib/common/sort-options';

export type ProjectStatusFilter = 'active' | 'archived';
export type ProjectSortBy =
  | 'updated'
  | 'created'
  | 'name'
  | 'surveys'
  | 'responses'
  | 'status'
  | 'context'
  | 'progress';

const STATUS_OPTIONS: ProjectStatusFilter[] = ['active', 'archived'];

const SORT_OPTIONS: ProjectSortBy[] = ['name', 'surveys', 'responses', 'updated', 'created'];

interface ProjectListToolbarProps {
  statusFilter: ProjectStatusFilter[];
  onStatusFilterChange: (filter: ProjectStatusFilter[]) => void;
  contextFilter: string[];
  onContextFilterChange: (contexts: string[]) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortBy: ProjectSortBy;
  sortDir: 'asc' | 'desc';
  onSortByChange: (sort: ProjectSortBy) => void;
  onSortDirChange: (dir: 'asc' | 'desc') => void;
  statusCounts: Record<string, number>;
  contextCounts: Record<string, number>;
}

export function ProjectListToolbar({
  statusFilter,
  onStatusFilterChange,
  contextFilter,
  onContextFilterChange,
  searchQuery,
  onSearchQueryChange,
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirChange,
  statusCounts,
  contextCounts,
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

  const contextOptions = sortOptionsAlphabetically(
    PROJECT_CONTEXTS.filter((ctx) => (contextCounts[ctx] ?? 0) > 0).map((ctx) => ({
      value: ctx,
      label: t(PROJECT_CONTEXTS_CONFIG[ctx].labelKey as MessageKey),
      count: contextCounts[ctx] ?? 0,
    }))
  );

  const filterGroups: FilterGroup[] = [statusGroup];

  if (contextOptions.length > 0) {
    filterGroups.push({
      label: t('projects.list.filters.contextSection'),
      options: contextOptions,
      selected: contextFilter,
      onChange: onContextFilterChange,
    });
  }

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
