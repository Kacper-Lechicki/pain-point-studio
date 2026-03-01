'use client';

import { useCallback } from 'react';

import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { NOW_UPDATE_INTERVAL_MS } from '@/features/surveys/config';
import { getDefaultSortDir, getSurveyComparator } from '@/features/surveys/lib/sort-helpers';
import { useListState } from '@/hooks/common/use-list-state';
// Re-import PerPage so we don't depend on use-pagination directly
import type { PerPage } from '@/hooks/common/use-pagination';

type SortDir = 'asc' | 'desc';

interface UseSurveyListStateOptions<TSortKey extends string> {
  surveys: UserSurvey[];
  /** Unique key prefix for sessionStorage (e.g. 'surveyList' or 'archiveList'). */
  storageKey: string;
  defaultSortBy: TSortKey;
  defaultSortDir?: SortDir;
  defaultPerPage?: PerPage;
  /** Breakpoint above which table layout is used (below = cards). Defaults to 'md'. */
  layoutBreakpoint?: 'md' | 'lg' | undefined;
  /** Pre-filters surveys before search/sort (e.g. exclude archived). */
  preFilter?: (survey: UserSurvey) => boolean;
  /** List-specific comparator for sort keys not handled by `getSurveyComparator`. */
  customComparator?: (
    sortBy: TSortKey,
    sortDir: SortDir
  ) => ((a: UserSurvey, b: UserSurvey) => number) | undefined;
}

const searchFn = (s: UserSurvey, q: string) =>
  s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);

export function useSurveyListState<TSortKey extends string>({
  surveys,
  storageKey,
  defaultSortBy,
  defaultSortDir,
  defaultPerPage = 10,
  layoutBreakpoint,
  preFilter,
  customComparator,
}: UseSurveyListStateOptions<TSortKey>) {
  // Two-tier comparator: common sorts first, then custom
  const comparator = useCallback(
    (sortBy: TSortKey, sortDir: SortDir) => {
      const common = getSurveyComparator(sortBy, sortDir);

      if (common) {
        return common;
      }

      return customComparator?.(sortBy, sortDir);
    },
    [customComparator]
  );

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
  } = useListState<UserSurvey, TSortKey>({
    items: surveys,
    storageKey,
    defaultSortBy,
    defaultSortDir,
    defaultPerPage,
    nowUpdateInterval: NOW_UPDATE_INTERVAL_MS,
    layoutBreakpoint,
    getDefaultSortDir,
    preFilter,
    searchFn,
    comparator,
  });

  return {
    now,
    isMd,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy: handleSortByChange,
    sortDir,
    setSortDir,
    handleSortByChange,
    handleSortByColumn,
    filteredSurveys: filteredItems,
    paginatedSurveys: paginatedItems,
    pagination,
  };
}
