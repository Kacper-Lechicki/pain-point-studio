'use client';

import type {
  ProjectSortBy,
  ProjectStatusFilter,
} from '@/features/projects/components/project-list-toolbar';
import { getDefaultSortDir, getProjectComparator } from '@/features/projects/lib/sort-helpers';
import type { ProjectWithMetrics } from '@/features/projects/types';
import type { ProjectsListExtrasMap } from '@/features/projects/types';
import { useListState } from '@/hooks/common/use-list-state';
import { useSessionState } from '@/hooks/common/use-session-state';

const STORAGE_KEY = 'projectList';

const searchFn = (p: ProjectWithMetrics, q: string) =>
  p.name.toLowerCase().includes(q) || (p.summary ?? '').toLowerCase().includes(q);

export function useProjectListState(
  projects: ProjectWithMetrics[],
  extras?: ProjectsListExtrasMap | null
) {
  // ── Project-specific filters (not part of the generic hook) ────────
  const [statusFilter, setStatusFilterRaw] = useSessionState<ProjectStatusFilter[]>(
    `${STORAGE_KEY}:status`,
    []
  );

  const preFilter = (p: ProjectWithMetrics) => {
    if (statusFilter.length > 0 && !statusFilter.includes(p.status as ProjectStatusFilter)) {
      return false;
    }

    // When no filter active, hide trashed projects from default view
    if (statusFilter.length === 0 && p.status === 'trashed') {
      return false;
    }

    return true;
  };

  // ── Comparator that captures extras context ───────────────────────
  const comparator = (sortBy: ProjectSortBy, sortDir: 'asc' | 'desc') =>
    getProjectComparator(sortBy, sortDir, extras);

  // ── Delegate to generic list state ─────────────────────────────────
  const {
    now,
    isMd,
    searchQuery,
    setSearchQuery,
    sortBy,
    sortDir,
    setSortDir,
    handleSortByChange,
    handleSortByColumn,
    filteredItems,
    paginatedItems,
    pagination,
    resetPage,
  } = useListState<ProjectWithMetrics, ProjectSortBy>({
    items: projects,
    storageKey: STORAGE_KEY,
    defaultSortBy: 'updated',
    layoutBreakpoint: 'lg',
    getDefaultSortDir,
    preFilter,
    searchFn,
    comparator,
  });

  // ── Page-resetting wrappers for domain filters ─────────────────────
  const setStatusFilter = (v: ProjectStatusFilter[]) => {
    setStatusFilterRaw(v);
    resetPage();
  };

  const isFiltered = statusFilter.length > 0;

  // ── Derived counts for KPI badges and toolbar ───────────────────────
  const statusCounts = (() => {
    const counts: Record<string, number> = {
      active: 0,
      completed: 0,
      trashed: 0,
    };

    for (const p of projects) {
      if (p.status in counts) {
        counts[p.status] = (counts[p.status] ?? 0) + 1;
      }
    }

    return counts;
  })();

  const kpiStatuses = (() => {
    // Show active and completed in KPI (not trashed)
    const order: ProjectStatusFilter[] = ['active', 'completed'];

    return order.filter((s) => (statusCounts[s] ?? 0) > 0);
  })();

  return {
    now,
    isMd,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    sortDir,
    setSortDir,
    handleSortByChange,
    handleSortByColumn,
    filteredProjects: filteredItems,
    paginatedProjects: paginatedItems,
    pagination,
    isFiltered,
    statusCounts,
    kpiStatuses,
  };
}
