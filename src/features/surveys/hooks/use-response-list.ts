'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

import { getSurveyResponses } from '@/features/surveys/actions/get-survey-responses';
import {
  DEFAULT_RESPONSE_FILTERS,
  type DeviceType,
  type ResponseListFilters,
  type ResponseSortBy,
  type ResponseStatus,
  type SortDirection,
  type SurveyResponseListItem,
} from '@/features/surveys/types/response-list';

interface UseResponseListOptions {
  surveyId: string;
}

export function useResponseList({ surveyId }: UseResponseListOptions) {
  const [items, setItems] = useState<SurveyResponseListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<ResponseListFilters>(DEFAULT_RESPONSE_FILTERS);
  const [isLoading, startTransition] = useTransition();
  const [hasLoaded, setHasLoaded] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResponses = useCallback(
    (overrides?: Partial<ResponseListFilters>) => {
      const merged = { ...filters, ...overrides };

      startTransition(async () => {
        const result = await getSurveyResponses({
          surveyId,
          page: merged.page,
          perPage: merged.perPage,
          status: merged.status,
          device: merged.device,
          hasContact: merged.hasContact,
          search: merged.search || undefined,
          dateFrom: merged.dateFrom || undefined,
          dateTo: merged.dateTo || undefined,
          sortBy: merged.sortBy,
          sortDir: merged.sortDir,
        });

        if (result.success && result.data) {
          setItems(result.data.items);
          setTotalCount(result.data.totalCount);
        }

        setHasLoaded(true);
      });
    },
    [surveyId, filters, startTransition]
  );

  // Fetch on mount and whenever filters change (except search, which is debounced)
  useEffect(() => {
    fetchResponses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    surveyId,
    filters.page,
    filters.perPage,
    filters.status,
    filters.device,
    filters.hasContact,
    filters.dateFrom,
    filters.dateTo,
    filters.sortBy,
    filters.sortDir,
  ]);

  const updateFilter = useCallback(
    <K extends keyof ResponseListFilters>(key: K, value: ResponseListFilters[K]) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
        page: key === 'page' ? (value as number) : 1,
      }));
    },
    []
  );

  const setSearch = useCallback(
    (value: string) => {
      setFilters((prev) => ({ ...prev, search: value }));

      // Debounce the actual fetch
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        fetchResponses({ search: value, page: 1 });
      }, 300);
    },
    [fetchResponses]
  );

  const setStatus = useCallback(
    (value: ResponseStatus | undefined) => updateFilter('status', value),
    [updateFilter]
  );

  const setDevice = useCallback(
    (value: DeviceType | undefined) => updateFilter('device', value),
    [updateFilter]
  );

  const setHasContact = useCallback(
    (value: boolean | undefined) => updateFilter('hasContact', value),
    [updateFilter]
  );

  const setDateRange = useCallback((dateFrom: string | undefined, dateTo: string | undefined) => {
    setFilters((prev) => ({ ...prev, dateFrom, dateTo, page: 1 }));
  }, []);

  const setSort = useCallback((sortBy: ResponseSortBy, sortDir: SortDirection) => {
    setFilters((prev) => ({ ...prev, sortBy, sortDir, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => updateFilter('page', page), [updateFilter]);

  const setPerPage = useCallback((perPage: number) => {
    setFilters((prev) => ({ ...prev, perPage, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_RESPONSE_FILTERS);
  }, []);

  return {
    items,
    totalCount,
    filters,
    isLoading,
    hasLoaded,
    setSearch,
    setStatus,
    setDevice,
    setHasContact,
    setDateRange,
    setSort,
    setPage,
    setPerPage,
    clearFilters,
    refresh: fetchResponses,
  };
}
