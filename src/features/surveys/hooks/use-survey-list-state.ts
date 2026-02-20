'use client';

import { useCallback, useMemo } from 'react';

import { useNow } from 'next-intl';

import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { NOW_UPDATE_INTERVAL_MS } from '@/features/surveys/config';
import { getDefaultSortDir, getSurveyComparator } from '@/features/surveys/lib/sort-helpers';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';
import type { PerPage } from '@/hooks/common/use-pagination';
import { useSessionState } from '@/hooks/common/use-session-state';

type SortDir = 'asc' | 'desc';

interface UseSurveyListStateOptions<TSortKey extends string> {
  surveys: UserSurvey[];
  /** Unique key prefix for sessionStorage (e.g. 'surveyList' or 'archiveList'). */
  storageKey: string;
  defaultSortBy: TSortKey;
  defaultSortDir?: SortDir;
  defaultPerPage?: PerPage;
  /** Pre-filters surveys before search/sort (e.g. exclude archived). */
  preFilter?: (survey: UserSurvey) => boolean;
  /** List-specific comparator for sort keys not handled by `getSurveyComparator`. */
  customComparator?: (
    sortBy: TSortKey,
    sortDir: SortDir
  ) => ((a: UserSurvey, b: UserSurvey) => number) | undefined;
}

export function useSurveyListState<TSortKey extends string>({
  surveys,
  storageKey,
  defaultSortBy,
  defaultSortDir,
  defaultPerPage = 10,
  preFilter,
  customComparator,
}: UseSurveyListStateOptions<TSortKey>) {
  const now = useNow({ updateInterval: NOW_UPDATE_INTERVAL_MS });
  const isMd = useBreakpoint('md');
  const resolvedDefaultDir = defaultSortDir ?? getDefaultSortDir(defaultSortBy);
  const [searchQuery, setSearchQueryRaw] = useSessionState(`${storageKey}:q`, '');
  const [categoryFilter, setCategoryFilterRaw] = useSessionState<string[]>(`${storageKey}:cat`, []);
  const [sortBy, setSortByRaw] = useSessionState<TSortKey>(`${storageKey}:sort`, defaultSortBy);

  const [sortDir, setSortDirRaw] = useSessionState<SortDir>(
    `${storageKey}:dir`,
    resolvedDefaultDir
  );

  const [page, setPage] = useSessionState(`${storageKey}:page`, 1);
  const [perPage, setPerPageRaw] = useSessionState<PerPage>(`${storageKey}:pp`, defaultPerPage);

  const setSearchQuery = useCallback(
    (value: string) => {
      setSearchQueryRaw(value);
      setPage(1);
    },
    [setSearchQueryRaw, setPage]
  );

  const setCategoryFilter = useCallback(
    (value: string[]) => {
      setCategoryFilterRaw(value);
      setPage(1);
    },
    [setCategoryFilterRaw, setPage]
  );

  const setSortBy = useCallback(
    (key: TSortKey) => {
      setSortByRaw(key);
      setSortDirRaw(getDefaultSortDir(key) as SortDir);
      setPage(1);
    },
    [setSortByRaw, setSortDirRaw, setPage]
  );

  const setSortDir = useCallback(
    (dir: SortDir) => {
      setSortDirRaw(dir);
      setPage(1);
    },
    [setSortDirRaw, setPage]
  );

  const handleSortByChange = setSortBy;

  const handleSortByColumn = useCallback(
    (key: TSortKey) => {
      if (sortBy === key) {
        setSortDirRaw((sortDir === 'asc' ? 'desc' : 'asc') as SortDir);
        setPage(1);
      } else {
        setSortByRaw(key);
        setSortDirRaw(getDefaultSortDir(key) as SortDir);
        setPage(1);
      }
    },
    [sortBy, sortDir, setSortByRaw, setSortDirRaw, setPage]
  );

  const filteredSurveys = useMemo(() => {
    let result = preFilter ? surveys.filter(preFilter) : surveys;

    // Category filter (multi-select, empty = all)
    if (categoryFilter.length > 0) {
      result = result.filter((s) => categoryFilter.includes(s.category));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();

      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
    }

    const common = getSurveyComparator(sortBy, sortDir);

    if (common) {
      return [...result].sort(common);
    }

    const custom = customComparator?.(sortBy, sortDir);

    if (custom) {
      return [...result].sort(custom);
    }

    return result;
  }, [surveys, searchQuery, categoryFilter, sortBy, sortDir, preFilter, customComparator]);

  // Pagination
  const totalItems = filteredSurveys.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  // Clamp page if it exceeds total (e.g. filter narrows results)
  const clampedPage = Math.min(page, totalPages);
  const startIndex = (clampedPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalItems);

  const goToPage = useCallback(
    (p: number) => {
      setPage(Math.max(1, Math.min(p, totalPages)));
    },
    [setPage, totalPages]
  );

  const setPerPage = useCallback(
    (pp: PerPage) => {
      setPerPageRaw(pp);
      setPage(1);
    },
    [setPerPageRaw, setPage]
  );

  const nextPage = useCallback(() => {
    setPage(Math.min(clampedPage + 1, totalPages));
  }, [setPage, clampedPage, totalPages]);

  const prevPage = useCallback(() => {
    setPage(Math.max(clampedPage - 1, 1));
  }, [setPage, clampedPage]);

  const pagination = useMemo(
    () => ({
      page: clampedPage,
      perPage,
      totalPages,
      totalItems,
      startIndex,
      endIndex,
      goToPage,
      setPerPage,
      nextPage,
      prevPage,
      canGoNext: clampedPage < totalPages,
      canGoPrev: clampedPage > 1,
    }),
    [
      clampedPage,
      perPage,
      totalPages,
      totalItems,
      startIndex,
      endIndex,
      goToPage,
      setPerPage,
      nextPage,
      prevPage,
    ]
  );

  const paginatedSurveys = useMemo(
    () => filteredSurveys.slice(startIndex, endIndex),
    [filteredSurveys, startIndex, endIndex]
  );

  return {
    now,
    isMd,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    handleSortByChange,
    handleSortByColumn,
    filteredSurveys,
    paginatedSurveys,
    pagination,
  };
}
