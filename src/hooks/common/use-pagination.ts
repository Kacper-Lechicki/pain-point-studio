'use client';

import { useEffect, useRef, useState } from 'react';

export type PerPage = 5 | 10 | 15;

export const PER_PAGE_OPTIONS: PerPage[] = [5, 10, 15];

const DEFAULT_PER_PAGE: PerPage = 10;

interface UsePaginationOptions {
  totalItems: number;
  defaultPerPage?: PerPage;
}

export interface PaginationState {
  page: number;
  perPage: PerPage;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  setPerPage: (perPage: PerPage) => void;
  nextPage: () => void;
  prevPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export function usePagination({
  totalItems,
  defaultPerPage = DEFAULT_PER_PAGE,
}: UsePaginationOptions): PaginationState {
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState<PerPage>(defaultPerPage);
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const effectivePage = Math.min(page, totalPages);
  const startIndex = (effectivePage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalItems);

  const goToPage = (p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  };

  const setPerPage = (pp: PerPage) => {
    setPerPageState(pp);
    setPage(1);
  };

  const nextPage = () => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  };

  const prevPage = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  return {
    page: effectivePage,
    perPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    goToPage,
    setPerPage,
    nextPage,
    prevPage,
    canGoNext: effectivePage < totalPages,
    canGoPrev: effectivePage > 1,
  };
}

/** Resets pagination to page 1. Call when search/filter/sort changes. */
export function useResetPaginationOnChange(goToPage: (page: number) => void, deps: unknown[]) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;

      return;
    }

    goToPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
