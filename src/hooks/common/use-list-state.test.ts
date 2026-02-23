// @vitest-environment jsdom
/** useListState: generic filtering, sorting, and pagination for list views. */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useListState } from './use-list-state';

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock('next-intl', () => ({
  useNow: () => new Date('2025-01-15T12:00:00Z'),
}));

vi.mock('@/hooks/common/use-breakpoint', () => ({
  useBreakpoint: () => true,
}));

vi.mock('@/hooks/common/use-session-state', async () => {
  const React = await import('react');

  return {
    useSessionState: <T>(_key: string, initial: T) => React.useState<T>(initial),
  };
});

// ── Helpers ──────────────────────────────────────────────────────────

interface TestItem {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
}

type TestSortBy = 'name' | 'updated';

function makeItem(id: string, name: string, status: 'active' | 'archived' = 'active'): TestItem {
  return { id, name, description: `Description for ${name}`, status };
}

const ITEMS: TestItem[] = [
  makeItem('1', 'Charlie'),
  makeItem('2', 'Alpha'),
  makeItem('3', 'Bravo'),
  makeItem('4', 'Delta'),
  makeItem('5', 'Echo'),
  makeItem('6', 'Foxtrot'),
  makeItem('7', 'Golf'),
  makeItem('8', 'Hotel'),
  makeItem('9', 'India'),
  makeItem('10', 'Juliet'),
  makeItem('11', 'Kilo'),
];

const getDefaultSortDir = (key: string) => (key === 'name' ? 'asc' : 'desc') as 'asc' | 'desc';

const comparator = (sortBy: TestSortBy, sortDir: 'asc' | 'desc') => {
  if (sortBy === 'name') {
    return (a: TestItem, b: TestItem) => {
      const cmp = a.name.localeCompare(b.name);

      return sortDir === 'asc' ? cmp : -cmp;
    };
  }

  return undefined;
};

const searchFn = (item: TestItem, q: string) =>
  item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);

function useTestListState(items: TestItem[] = ITEMS) {
  return useListState<TestItem, TestSortBy>({
    items,
    storageKey: 'testList',
    defaultSortBy: 'updated',
    getDefaultSortDir,
    comparator,
    searchFn,
  });
}

// ── Tests ────────────────────────────────────────────────────────────

describe('useListState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all items with default sort', () => {
    const { result } = renderHook(() => useTestListState());

    expect(result.current.filteredItems).toHaveLength(11);
    expect(result.current.sortBy).toBe('updated');
    expect(result.current.sortDir).toBe('desc');
  });

  it('should filter by search query matching name', () => {
    const { result } = renderHook(() => useTestListState());

    act(() => {
      result.current.setSearchQuery('alpha');
    });

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0]!.name).toBe('Alpha');
  });

  it('should filter by search query matching description', () => {
    const { result } = renderHook(() => useTestListState());

    act(() => {
      result.current.setSearchQuery('Description for Bravo');
    });

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0]!.name).toBe('Bravo');
  });

  it('should apply preFilter before search', () => {
    const preFilter = (item: TestItem) => item.status === 'active';
    const items = [
      makeItem('1', 'Active One', 'active'),
      makeItem('2', 'Archived One', 'archived'),
      makeItem('3', 'Active Two', 'active'),
    ];

    const { result } = renderHook(() =>
      useListState<TestItem, TestSortBy>({
        items,
        storageKey: 'testList',
        defaultSortBy: 'updated',
        getDefaultSortDir,
        comparator,
        searchFn,
        preFilter,
      })
    );

    expect(result.current.filteredItems).toHaveLength(2);
    expect(result.current.filteredItems.every((i) => i.status === 'active')).toBe(true);
  });

  it('should reset page to 1 when search changes', () => {
    const { result } = renderHook(() => useTestListState());

    act(() => {
      result.current.pagination.goToPage(2);
    });

    expect(result.current.pagination.page).toBe(2);

    act(() => {
      result.current.setSearchQuery('alpha');
    });

    expect(result.current.pagination.page).toBe(1);
  });

  it('should reset page to 1 when sort changes via handleSortByChange', () => {
    const { result } = renderHook(() => useTestListState());

    act(() => {
      result.current.pagination.goToPage(2);
    });

    act(() => {
      result.current.handleSortByChange('name');
    });

    expect(result.current.pagination.page).toBe(1);
    expect(result.current.sortBy).toBe('name');
    expect(result.current.sortDir).toBe('asc');
  });

  it('should reset page to 1 when sort direction changes', () => {
    const { result } = renderHook(() => useTestListState());

    act(() => {
      result.current.pagination.goToPage(2);
    });

    act(() => {
      result.current.setSortDir('asc');
    });

    expect(result.current.pagination.page).toBe(1);
    expect(result.current.sortDir).toBe('asc');
  });

  it('should toggle direction via handleSortByColumn for same key', () => {
    const { result } = renderHook(() => useTestListState());

    act(() => {
      result.current.handleSortByChange('name');
    });

    expect(result.current.sortDir).toBe('asc');

    act(() => {
      result.current.handleSortByColumn('name');
    });

    expect(result.current.sortDir).toBe('desc');
  });

  it('should change key via handleSortByColumn for different key', () => {
    const { result } = renderHook(() => useTestListState());

    act(() => {
      result.current.handleSortByColumn('name');
    });

    expect(result.current.sortBy).toBe('name');
    expect(result.current.sortDir).toBe('asc');
  });

  it('should paginate correctly with default perPage', () => {
    const { result } = renderHook(() => useTestListState());

    expect(result.current.paginatedItems).toHaveLength(10);
    expect(result.current.pagination.totalPages).toBe(2);
    expect(result.current.pagination.totalItems).toBe(11);
    expect(result.current.pagination.canGoNext).toBe(true);
    expect(result.current.pagination.canGoPrev).toBe(false);
  });

  it('should navigate to next page', () => {
    const { result } = renderHook(() => useTestListState());

    act(() => {
      result.current.pagination.nextPage();
    });

    expect(result.current.pagination.page).toBe(2);
    expect(result.current.paginatedItems).toHaveLength(1);
  });

  it('should navigate to previous page', () => {
    const { result } = renderHook(() => useTestListState());

    act(() => {
      result.current.pagination.goToPage(2);
    });

    act(() => {
      result.current.pagination.prevPage();
    });

    expect(result.current.pagination.page).toBe(1);
  });

  it('should clamp page when filter narrows results', () => {
    const { result } = renderHook(() => useTestListState());

    act(() => {
      result.current.pagination.goToPage(2);
    });

    act(() => {
      result.current.setSearchQuery('Alpha');
    });

    expect(result.current.pagination.page).toBe(1);
  });

  it('should change perPage and reset to page 1', () => {
    const { result } = renderHook(() => useTestListState());

    act(() => {
      result.current.pagination.goToPage(2);
    });

    act(() => {
      result.current.pagination.setPerPage(5);
    });

    expect(result.current.pagination.perPage).toBe(5);
    expect(result.current.pagination.page).toBe(1);
  });

  it('should sort by name ascending', () => {
    const { result } = renderHook(() => useTestListState());

    act(() => {
      result.current.handleSortByChange('name');
    });

    const names = result.current.filteredItems.map((i) => i.name);

    expect(names).toEqual([
      'Alpha',
      'Bravo',
      'Charlie',
      'Delta',
      'Echo',
      'Foxtrot',
      'Golf',
      'Hotel',
      'India',
      'Juliet',
      'Kilo',
    ]);
  });

  it('should expose a stable resetPage callback', () => {
    const { result } = renderHook(() => useTestListState());

    act(() => {
      result.current.pagination.goToPage(2);
    });

    expect(result.current.pagination.page).toBe(2);

    act(() => {
      result.current.resetPage();
    });

    expect(result.current.pagination.page).toBe(1);
  });
});
