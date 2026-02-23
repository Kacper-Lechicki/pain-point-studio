'use client';

import { useCallback, useMemo } from 'react';

import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import type {
  ProjectSortBy,
  ProjectStatusFilter,
} from '@/features/projects/components/project-list-toolbar';
import { PROJECT_CONTEXTS_CONFIG } from '@/features/projects/config/contexts';
import { getDefaultSortDir, getProjectComparator } from '@/features/projects/lib/sort-helpers';
import { useListState } from '@/hooks/common/use-list-state';
import { useSessionState } from '@/hooks/common/use-session-state';

const STORAGE_KEY = 'projectList';

const searchFn = (p: ProjectWithMetrics, q: string) =>
  p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q);

export function useProjectListState(projects: ProjectWithMetrics[]) {
  // ── Project-specific filters (not part of the generic hook) ────────
  const [statusFilter, setStatusFilterRaw] = useSessionState<ProjectStatusFilter[]>(
    `${STORAGE_KEY}:status`,
    []
  );

  const [contextFilter, setContextFilterRaw] = useSessionState<string[]>(`${STORAGE_KEY}:ctx`, []);

  const preFilter = useCallback(
    (p: ProjectWithMetrics) => {
      if (statusFilter.length > 0 && !statusFilter.includes(p.status as ProjectStatusFilter)) {
        return false;
      }

      if (contextFilter.length > 0 && !contextFilter.includes(p.context)) {
        return false;
      }

      return true;
    },
    [statusFilter, contextFilter]
  );

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
    getDefaultSortDir,
    preFilter,
    searchFn,
    comparator: getProjectComparator,
  });

  // ── Page-resetting wrappers for domain filters ─────────────────────
  const setStatusFilter = useCallback(
    (v: ProjectStatusFilter[]) => {
      setStatusFilterRaw(v);
      resetPage();
    },
    [setStatusFilterRaw, resetPage]
  );

  const setContextFilter = useCallback(
    (v: string[]) => {
      setContextFilterRaw(v);
      resetPage();
    },
    [setContextFilterRaw, resetPage]
  );

  const isFiltered = statusFilter.length > 0 || contextFilter.length > 0;

  // ── Derived counts for KPI badges and toolbar ───────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { active: 0, archived: 0 };

    for (const p of projects) {
      if (p.status in counts) {
        counts[p.status] = (counts[p.status] ?? 0) + 1;
      }
    }

    return counts;
  }, [projects]);

  const contextCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const key of Object.keys(PROJECT_CONTEXTS_CONFIG)) {
      counts[key] = 0;
    }

    for (const p of projects) {
      if (statusFilter.length === 0 || statusFilter.includes(p.status as ProjectStatusFilter)) {
        counts[p.context] = (counts[p.context] ?? 0) + 1;
      }
    }

    return counts;
  }, [projects, statusFilter]);

  const kpiStatuses = useMemo(() => {
    const order: ProjectStatusFilter[] = ['active', 'archived'];

    return order.filter((s) => (statusCounts[s] ?? 0) > 0);
  }, [statusCounts]);

  return {
    now,
    isMd,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    contextFilter,
    setContextFilter,
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
    contextCounts,
    kpiStatuses,
  };
}
