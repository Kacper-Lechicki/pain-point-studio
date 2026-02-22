'use client';

import { useCallback, useMemo } from 'react';

import { useNow } from 'next-intl';

import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import type {
  ProjectSortBy,
  ProjectStatusFilter,
} from '@/features/projects/components/project-list-toolbar';
import { getDefaultSortDir, getProjectComparator } from '@/features/projects/lib/sort-helpers';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';
import type { PerPage } from '@/hooks/common/use-pagination';
import { useSessionState } from '@/hooks/common/use-session-state';

const STORAGE_KEY = 'projectList';

export function useProjectListState(projects: ProjectWithMetrics[]) {
  const now = useNow({ updateInterval: 60_000 });
  const isMd = useBreakpoint('md');

  const [statusFilter, setStatusFilterRaw] = useSessionState<ProjectStatusFilter[]>(
    `${STORAGE_KEY}:status`,
    []
  );

  const [contextFilter, setContextFilterRaw] = useSessionState<string[]>(`${STORAGE_KEY}:ctx`, []);
  const [searchQuery, setSearchQueryRaw] = useSessionState(`${STORAGE_KEY}:q`, '');
  const [sortBy, setSortByRaw] = useSessionState<ProjectSortBy>(`${STORAGE_KEY}:sort`, 'updated');
  const [sortDir, setSortDirRaw] = useSessionState<'asc' | 'desc'>(`${STORAGE_KEY}:dir`, 'desc');
  const [page, setPage] = useSessionState(`${STORAGE_KEY}:page`, 1);
  const [perPage, setPerPageRaw] = useSessionState<PerPage>(`${STORAGE_KEY}:pp`, 10);

  const setSearchQuery = useCallback(
    (v: string) => {
      setSearchQueryRaw(v);
      setPage(1);
    },
    [setSearchQueryRaw, setPage]
  );

  const setStatusFilter = useCallback(
    (v: ProjectStatusFilter[]) => {
      setStatusFilterRaw(v);
      setPage(1);
    },
    [setStatusFilterRaw, setPage]
  );

  const setContextFilter = useCallback(
    (v: string[]) => {
      setContextFilterRaw(v);
      setPage(1);
    },
    [setContextFilterRaw, setPage]
  );

  const handleSortByChange = useCallback(
    (key: ProjectSortBy) => {
      setSortByRaw(key);
      setSortDirRaw(getDefaultSortDir(key));
      setPage(1);
    },
    [setSortByRaw, setSortDirRaw, setPage]
  );

  const setSortDir = useCallback(
    (dir: 'asc' | 'desc') => {
      setSortDirRaw(dir);
      setPage(1);
    },
    [setSortDirRaw, setPage]
  );

  const handleSortByColumn = useCallback(
    (key: ProjectSortBy) => {
      if (sortBy === key) {
        setSortDirRaw(sortDir === 'asc' ? 'desc' : 'asc');
      } else {
        setSortByRaw(key);
        setSortDirRaw(getDefaultSortDir(key));
      }

      setPage(1);
    },
    [sortBy, sortDir, setSortByRaw, setSortDirRaw, setPage]
  );

  const filteredProjects = useMemo(() => {
    let result = projects;

    if (statusFilter.length > 0) {
      result = result.filter((p) => statusFilter.includes(p.status as ProjectStatusFilter));
    }

    if (contextFilter.length > 0) {
      result = result.filter((p) => contextFilter.includes(p.context));
    }

    const q = searchQuery.trim().toLowerCase();

    if (q) {
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
      );
    }

    return [...result].sort(getProjectComparator(sortBy, sortDir));
  }, [projects, statusFilter, contextFilter, searchQuery, sortBy, sortDir]);

  const totalItems = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const clampedPage = Math.min(page, totalPages);
  const startIndex = (clampedPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalItems);

  const setPerPage = useCallback(
    (pp: PerPage) => {
      setPerPageRaw(pp);
      setPage(1);
    },
    [setPerPageRaw, setPage]
  );

  const pagination = useMemo(
    () => ({
      page: clampedPage,
      perPage,
      totalPages,
      totalItems,
      startIndex,
      endIndex,
      goToPage: (p: number) => setPage(Math.max(1, Math.min(p, totalPages))),
      setPerPage,
      nextPage: () => setPage(Math.min(clampedPage + 1, totalPages)),
      prevPage: () => setPage(Math.max(clampedPage - 1, 1)),
      canGoNext: clampedPage < totalPages,
      canGoPrev: clampedPage > 1,
    }),
    [clampedPage, perPage, totalPages, totalItems, startIndex, endIndex, setPerPage, setPage]
  );

  const paginatedProjects = useMemo(
    () => filteredProjects.slice(startIndex, endIndex),
    [filteredProjects, startIndex, endIndex]
  );

  const isFiltered = statusFilter.length > 0 || contextFilter.length > 0;

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
    filteredProjects,
    paginatedProjects,
    pagination,
    isFiltered,
  };
}
