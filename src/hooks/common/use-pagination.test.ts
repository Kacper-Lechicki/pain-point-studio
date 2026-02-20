/** usePagination hook: page state, navigation helpers, and boundary clamping. */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePagination, useResetPaginationOnChange } from './use-pagination';

describe('usePagination', () => {
  // Defaults: page 1, perPage 10.
  it('should initialise with default values', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 25 }));

    expect(result.current.page).toBe(1);
    expect(result.current.perPage).toBe(10);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.totalItems).toBe(25);
  });

  // Respects defaultPerPage option.
  it('should use custom defaultPerPage', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 25, defaultPerPage: 5 }));

    expect(result.current.perPage).toBe(5);
    expect(result.current.totalPages).toBe(5);
  });

  // startIndex / endIndex for first page.
  it('should compute startIndex and endIndex correctly', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 25 }));

    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(10);
  });

  // Last page endIndex clamps to totalItems.
  it('should clamp endIndex to totalItems on last page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 25 }));

    act(() => {
      result.current.goToPage(3);
    });

    expect(result.current.startIndex).toBe(20);
    expect(result.current.endIndex).toBe(25);
  });

  // goToPage navigates to the requested page.
  it('should navigate with goToPage', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 50 }));

    act(() => {
      result.current.goToPage(3);
    });

    expect(result.current.page).toBe(3);
  });

  // goToPage clamps below 1.
  it('should clamp goToPage below 1', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 50 }));

    act(() => {
      result.current.goToPage(-5);
    });

    expect(result.current.page).toBe(1);
  });

  // goToPage clamps above totalPages.
  it('should clamp goToPage above totalPages', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 25 }));

    act(() => {
      result.current.goToPage(100);
    });

    expect(result.current.page).toBe(3);
  });

  // nextPage / prevPage.
  it('should advance with nextPage', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 50 }));

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.page).toBe(2);
  });

  it('should go back with prevPage', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 50 }));

    act(() => {
      result.current.goToPage(3);
    });

    act(() => {
      result.current.prevPage();
    });

    expect(result.current.page).toBe(2);
  });

  // nextPage does nothing on last page.
  it('should not go past last page with nextPage', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 10 }));

    expect(result.current.totalPages).toBe(1);

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.page).toBe(1);
  });

  // prevPage does nothing on first page.
  it('should not go before first page with prevPage', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 50 }));

    act(() => {
      result.current.prevPage();
    });

    expect(result.current.page).toBe(1);
  });

  // canGoNext / canGoPrev flags.
  it('should expose canGoNext and canGoPrev flags', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 20 }));

    expect(result.current.canGoNext).toBe(true);
    expect(result.current.canGoPrev).toBe(false);

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.canGoNext).toBe(false);
    expect(result.current.canGoPrev).toBe(true);
  });

  // setPerPage resets to page 1.
  it('should reset to page 1 when perPage changes', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 50 }));

    act(() => {
      result.current.goToPage(4);
    });

    expect(result.current.page).toBe(4);

    act(() => {
      result.current.setPerPage(15);
    });

    expect(result.current.page).toBe(1);
    expect(result.current.perPage).toBe(15);
    expect(result.current.totalPages).toBe(4);
  });

  // Effective page clamps when totalItems shrinks (e.g. filter applied).
  it('should clamp page when totalItems shrinks', () => {
    const { result, rerender } = renderHook(({ totalItems }) => usePagination({ totalItems }), {
      initialProps: { totalItems: 50 },
    });

    act(() => {
      result.current.goToPage(5);
    });

    expect(result.current.page).toBe(5);

    rerender({ totalItems: 10 });

    expect(result.current.page).toBe(1);
  });

  // Zero items: totalPages is 1, page is 1, indices are 0/0.
  it('should handle zero totalItems', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 0 }));

    expect(result.current.totalPages).toBe(1);
    expect(result.current.page).toBe(1);
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(0);
    expect(result.current.canGoNext).toBe(false);
    expect(result.current.canGoPrev).toBe(false);
  });
});

describe('useResetPaginationOnChange', () => {
  // Does not call goToPage on first render.
  it('should not reset on first render', () => {
    const goToPage = vi.fn();

    renderHook(() => useResetPaginationOnChange(goToPage, ['initial']));

    expect(goToPage).not.toHaveBeenCalled();
  });

  // Calls goToPage(1) when deps change after first render.
  it('should call goToPage(1) when deps change', () => {
    const goToPage = vi.fn();

    const { rerender } = renderHook(({ dep }) => useResetPaginationOnChange(goToPage, [dep]), {
      initialProps: { dep: 'a' },
    });

    expect(goToPage).not.toHaveBeenCalled();

    rerender({ dep: 'b' });

    expect(goToPage).toHaveBeenCalledWith(1);
    expect(goToPage).toHaveBeenCalledTimes(1);
  });
});
