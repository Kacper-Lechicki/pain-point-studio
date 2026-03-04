'use client';

import { useNow } from 'next-intl';

import { useBreakpoint } from '@/hooks/common/use-breakpoint';
import type { PerPage } from '@/hooks/common/use-pagination';
import type { PaginationState } from '@/hooks/common/use-pagination';
import { useSessionState } from '@/hooks/common/use-session-state';

type SortDir = 'asc' | 'desc';

interface UseListStateOptions<TItem, TSortBy extends string> {
  /** The full, unfiltered list of items. */
  items: TItem[];
  /** Unique prefix for sessionStorage keys (e.g. 'projectList', 'surveyList'). */
  storageKey: string;
  /** Default sort key. */
  defaultSortBy: TSortBy;
  /** Default sort direction. Falls back to getDefaultSortDir(defaultSortBy). */
  defaultSortDir?: SortDir | undefined;
  /** Default items per page. Defaults to 10. */
  defaultPerPage?: PerPage | undefined;
  /** Interval in ms for useNow. Defaults to 60_000. */
  nowUpdateInterval?: number | undefined;
  /** Breakpoint above which table layout is used (below = cards). Defaults to 'md'. Use 'lg' to show cards one breakpoint earlier. */
  layoutBreakpoint?: 'md' | 'lg' | undefined;

  /**
   * Returns the default sort direction for a given sort key.
   * Used when sort key changes to pick an appropriate initial direction.
   */
  getDefaultSortDir: (key: string) => SortDir;

  /**
   * Pre-filter applied before search. The consumer composes domain-specific
   * filters (status, context, project, etc.) into this single callback.
   * If omitted, all items pass through.
   */
  preFilter?: ((item: TItem) => boolean) | undefined;

  /**
   * Text search: given an item and a lowercase, trimmed query string,
   * return true if the item matches. If omitted, search is disabled.
   */
  searchFn?: ((item: TItem, query: string) => boolean) | undefined;

  /**
   * Returns a comparator for the given sort key and direction.
   * If undefined is returned, items are left in their current order.
   */
  comparator: (sortBy: TSortBy, sortDir: SortDir) => ((a: TItem, b: TItem) => number) | undefined;
}

interface UseListStateReturn<TItem, TSortBy extends string> {
  now: Date;
  isMd: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  sortBy: TSortBy;
  sortDir: SortDir;
  setSortDir: (dir: SortDir) => void;
  handleSortByChange: (key: TSortBy) => void;
  handleSortByColumn: (key: TSortBy) => void;
  filteredItems: TItem[];
  paginatedItems: TItem[];
  pagination: PaginationState;
  /** Stable callback that resets page to 1. Useful for domain-specific filter wrappers. */
  resetPage: () => void;
}

export function useListState<TItem, TSortBy extends string>({
  items,
  storageKey,
  defaultSortBy,
  defaultSortDir,
  defaultPerPage = 10,
  nowUpdateInterval = 60_000,
  layoutBreakpoint = 'md',
  getDefaultSortDir,
  preFilter,
  searchFn,
  comparator,
}: UseListStateOptions<TItem, TSortBy>): UseListStateReturn<TItem, TSortBy> {
  const now = useNow({ updateInterval: nowUpdateInterval });
  const isMd = useBreakpoint(layoutBreakpoint);
  const resolvedDefaultDir = defaultSortDir ?? getDefaultSortDir(defaultSortBy);

  // ── Persisted state ────────────────────────────────────────────────
  const [searchQuery, setSearchQueryRaw] = useSessionState(`${storageKey}:q`, '');
  const [sortBy, setSortByRaw] = useSessionState<TSortBy>(`${storageKey}:sort`, defaultSortBy);
  const [sortDir, setSortDirRaw] = useSessionState<SortDir>(
    `${storageKey}:dir`,
    resolvedDefaultDir
  );
  const [page, setPage] = useSessionState(`${storageKey}:page`, 1);
  const [perPage, setPerPageRaw] = useSessionState<PerPage>(`${storageKey}:pp`, defaultPerPage);

  // ── Page-resetting setters ─────────────────────────────────────────
  const resetPage = () => {
    setPage(1);
  };

  const setSearchQuery = (value: string) => {
    setSearchQueryRaw(value);
    setPage(1);
  };

  const handleSortByChange = (key: TSortBy) => {
    setSortByRaw(key);
    setSortDirRaw(getDefaultSortDir(key) as SortDir);
    setPage(1);
  };

  const setSortDir = (dir: SortDir) => {
    setSortDirRaw(dir);
    setPage(1);
  };

  const handleSortByColumn = (key: TSortBy) => {
    if (sortBy === key) {
      setSortDirRaw((sortDir === 'asc' ? 'desc' : 'asc') as SortDir);
      setPage(1);
    } else {
      setSortByRaw(key);
      setSortDirRaw(getDefaultSortDir(key) as SortDir);
      setPage(1);
    }
  };

  // ── Filtering + sorting ────────────────────────────────────────────
  let filteredItems: TItem[];
  {
    let result = preFilter ? items.filter(preFilter) : items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();

      if (searchFn) {
        result = result.filter((item) => searchFn(item, q));
      }
    }

    const cmp = comparator(sortBy, sortDir);

    if (cmp) {
      filteredItems = [...result].sort(cmp);
    } else {
      filteredItems = result;
    }
  }

  // ── Pagination ─────────────────────────────────────────────────────
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const clampedPage = Math.min(page, totalPages);
  const startIndex = (clampedPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalItems);

  const goToPage = (p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  };

  const setPerPage = (pp: PerPage) => {
    setPerPageRaw(pp);
    setPage(1);
  };

  const nextPage = () => {
    setPage(Math.min(clampedPage + 1, totalPages));
  };

  const prevPage = () => {
    setPage(Math.max(clampedPage - 1, 1));
  };

  const pagination: PaginationState = {
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
  };

  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  return {
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
  };
}
