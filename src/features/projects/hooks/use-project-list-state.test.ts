// @vitest-environment jsdom
/** useProjectListState: filtering, sorting, and pagination of project lists. */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProjectWithMetrics } from '@/features/projects/types';

import { useProjectListState } from './use-project-list-state';

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock('next-intl', () => ({
  useNow: () => new Date('2025-01-15T12:00:00Z'),
}));

vi.mock('@/features/projects/lib/sort-helpers', () => ({
  getDefaultSortDir: (key: string) => (['name', 'status'].includes(key) ? 'asc' : 'desc'),
  getProjectComparator:
    (sortBy: string, sortDir: string) => (a: ProjectWithMetrics, b: ProjectWithMetrics) => {
      if (sortBy === 'name') {
        const cmp = a.name.localeCompare(b.name);

        return sortDir === 'asc' ? cmp : -cmp;
      }

      // Default: sort by updated_at desc
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    },
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

function makeProject(id: string, name: string, status = 'active'): ProjectWithMetrics {
  return {
    id,
    name,
    summary: `Description for ${name}`,
    description: null,
    image_url: null,
    status,
    user_id: 'user-1',
    response_limit: 0,
    completed_at: null,
    deleted_at: null,
    pre_trash_status: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
    surveyCount: 3,
    activeSurveyCount: 1,
    responseCount: 10,
  };
}

const PROJECTS: ProjectWithMetrics[] = [
  makeProject('1', 'Charlie Project'),
  makeProject('2', 'Alpha Project'),
  makeProject('3', 'Bravo Project'),
  makeProject('4', 'Delta Project'),
  makeProject('5', 'Echo Project'),
  makeProject('6', 'Foxtrot Project'),
  makeProject('7', 'Golf Project'),
  makeProject('8', 'Hotel Project'),
  makeProject('9', 'India Project'),
  makeProject('10', 'Juliet Project'),
  makeProject('11', 'Kilo Project'),
];

// ── Tests ────────────────────────────────────────────────────────────

describe('useProjectListState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all projects with default sort (updated desc)', () => {
    const { result } = renderHook(() => useProjectListState(PROJECTS));

    expect(result.current.filteredProjects).toHaveLength(11);
    expect(result.current.sortBy).toBe('updated');
    expect(result.current.sortDir).toBe('desc');
  });

  it('should filter projects by search query matching name', () => {
    const { result } = renderHook(() => useProjectListState(PROJECTS));

    act(() => {
      result.current.setSearchQuery('alpha');
    });

    expect(result.current.filteredProjects).toHaveLength(1);
    expect(result.current.filteredProjects[0]!.name).toBe('Alpha Project');
  });

  it('should filter projects by search query matching summary', () => {
    const { result } = renderHook(() => useProjectListState(PROJECTS));

    act(() => {
      result.current.setSearchQuery('Description for Bravo');
    });

    expect(result.current.filteredProjects).toHaveLength(1);
    expect(result.current.filteredProjects[0]!.name).toBe('Bravo Project');
  });

  it('should filter by status', () => {
    const projects = [
      makeProject('1', 'Active One', 'active'),
      makeProject('2', 'Completed One', 'completed'),
      makeProject('3', 'Active Two', 'active'),
    ];

    const { result } = renderHook(() => useProjectListState(projects));

    act(() => {
      result.current.setStatusFilter(['completed']);
    });

    expect(result.current.filteredProjects).toHaveLength(1);
    expect(result.current.filteredProjects[0]!.name).toBe('Completed One');
  });

  it('should reset page to 1 when search query changes', () => {
    const { result } = renderHook(() => useProjectListState(PROJECTS));

    // Go to page 2 first
    act(() => {
      result.current.pagination.goToPage(2);
    });

    expect(result.current.pagination.page).toBe(2);

    // Search should reset to page 1
    act(() => {
      result.current.setSearchQuery('alpha');
    });

    expect(result.current.pagination.page).toBe(1);
  });

  it('should reset page to 1 when status filter changes', () => {
    const { result } = renderHook(() => useProjectListState(PROJECTS));

    act(() => {
      result.current.pagination.goToPage(2);
    });

    act(() => {
      result.current.setStatusFilter(['active']);
    });

    expect(result.current.pagination.page).toBe(1);
  });

  it('should reset page to 1 when sort changes via handleSortByChange', () => {
    const { result } = renderHook(() => useProjectListState(PROJECTS));

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

  it('should paginate projects correctly', () => {
    const { result } = renderHook(() => useProjectListState(PROJECTS));

    // Default perPage=10, 11 projects -> 2 pages
    expect(result.current.paginatedProjects).toHaveLength(10);
    expect(result.current.pagination.totalPages).toBe(2);
    expect(result.current.pagination.totalItems).toBe(11);
    expect(result.current.pagination.canGoNext).toBe(true);
    expect(result.current.pagination.canGoPrev).toBe(false);
  });

  it('should navigate to next page', () => {
    const { result } = renderHook(() => useProjectListState(PROJECTS));

    act(() => {
      result.current.pagination.nextPage();
    });

    expect(result.current.pagination.page).toBe(2);
    expect(result.current.paginatedProjects).toHaveLength(1);
  });

  it('should navigate to previous page', () => {
    const { result } = renderHook(() => useProjectListState(PROJECTS));

    act(() => {
      result.current.pagination.goToPage(2);
    });

    act(() => {
      result.current.pagination.prevPage();
    });

    expect(result.current.pagination.page).toBe(1);
  });

  it('should clamp page when filter narrows results', () => {
    const { result } = renderHook(() => useProjectListState(PROJECTS));

    act(() => {
      result.current.pagination.goToPage(2);
    });

    // Searching narrows to 1 result -> totalPages=1 -> page clamped to 1
    act(() => {
      result.current.setSearchQuery('Alpha');
    });

    expect(result.current.pagination.page).toBe(1);
  });

  it('should toggle sort direction via handleSortByColumn for the same key', () => {
    const { result } = renderHook(() => useProjectListState(PROJECTS));

    // Change to 'name' sort first (default dir = asc)
    act(() => {
      result.current.handleSortByChange('name');
    });

    expect(result.current.sortDir).toBe('asc');

    // Clicking same column toggles direction
    act(() => {
      result.current.handleSortByColumn('name');
    });

    expect(result.current.sortDir).toBe('desc');
  });

  it('should change sort key via handleSortByColumn for a different key', () => {
    const { result } = renderHook(() => useProjectListState(PROJECTS));

    act(() => {
      result.current.handleSortByColumn('name');
    });

    expect(result.current.sortBy).toBe('name');
    expect(result.current.sortDir).toBe('asc');
  });

  it('should change perPage and reset to page 1', () => {
    const { result } = renderHook(() => useProjectListState(PROJECTS));

    act(() => {
      result.current.pagination.goToPage(2);
    });

    act(() => {
      result.current.pagination.setPerPage(5);
    });

    expect(result.current.pagination.perPage).toBe(5);
    expect(result.current.pagination.page).toBe(1);
  });

  it('should report isFiltered when status filter is active', () => {
    const { result } = renderHook(() => useProjectListState(PROJECTS));

    expect(result.current.isFiltered).toBe(false);

    act(() => {
      result.current.setStatusFilter(['active']);
    });

    expect(result.current.isFiltered).toBe(true);
  });

  it('should change sort direction via setSortDir', () => {
    const { result } = renderHook(() => useProjectListState(PROJECTS));

    act(() => {
      result.current.setSortDir('asc');
    });

    expect(result.current.sortDir).toBe('asc');
  });

  it('should sort by name when handleSortByChange is called with name', () => {
    const { result } = renderHook(() => useProjectListState(PROJECTS));

    act(() => {
      result.current.handleSortByChange('name');
    });

    const names = result.current.filteredProjects.map((p) => p.name);

    expect(names).toEqual([
      'Alpha Project',
      'Bravo Project',
      'Charlie Project',
      'Delta Project',
      'Echo Project',
      'Foxtrot Project',
      'Golf Project',
      'Hotel Project',
      'India Project',
      'Juliet Project',
      'Kilo Project',
    ]);
  });
});
