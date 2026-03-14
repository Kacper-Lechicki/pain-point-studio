// @vitest-environment jsdom
/** useSurveyListState: filtering, sorting, and pagination of survey lists. */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserSurvey } from '@/features/surveys/types';

import { useSurveyListState } from './use-survey-list-state';

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock('next-intl', () => ({
  useNow: () => new Date('2025-01-15T12:00:00Z'),
}));

vi.mock('@/features/surveys/config', () => ({
  NOW_UPDATE_INTERVAL_MS: 60_000,
}));

vi.mock('@/features/surveys/lib/sort-helpers', () => ({
  getDefaultSortDir: (key: string) => (key === 'title' ? 'asc' : 'desc'),
  getSurveyComparator: (sortBy: string, sortDir: string) => (a: UserSurvey, b: UserSurvey) => {
    if (sortBy === 'title') {
      const cmp = a.title.localeCompare(b.title);

      return sortDir === 'asc' ? cmp : -cmp;
    }

    return 0;
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

function makeSurvey(id: string, title: string): UserSurvey {
  return {
    id,
    title,
    description: `Description for ${title}`,
    status: 'active',
    slug: id,
    viewCount: 10,
    responseCount: 5,
    completedCount: 3,
    questionCount: 5,
    recentActivity: Array(14).fill(1),
    lastResponseAt: null,
    startsAt: null,
    endsAt: null,
    maxRespondents: null,
    archivedAt: null,
    cancelledAt: null,
    completedAt: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    avgCompletionSeconds: null,
    avgQuestionCompletion: null,
    projectId: 'project-1',
    projectName: 'Test Project',
    researchPhase: null,
    deletedAt: null,
    preTrashStatus: null,
    previousStatus: null,
  };
}

const SURVEYS: UserSurvey[] = [
  makeSurvey('1', 'Charlie Survey'),
  makeSurvey('2', 'Alpha Survey'),
  makeSurvey('3', 'Bravo Survey'),
  makeSurvey('4', 'Delta Survey'),
  makeSurvey('5', 'Echo Survey'),
  makeSurvey('6', 'Foxtrot Survey'),
  makeSurvey('7', 'Golf Survey'),
  makeSurvey('8', 'Hotel Survey'),
  makeSurvey('9', 'India Survey'),
  makeSurvey('10', 'Juliet Survey'),
  makeSurvey('11', 'Kilo Survey'),
];

const DEFAULT_OPTIONS = {
  surveys: SURVEYS,
  storageKey: 'test',
  defaultSortBy: 'title',
};

// ── Tests ────────────────────────────────────────────────────────────

describe('useSurveyListState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all surveys sorted by title ascending by default', () => {
    const { result } = renderHook(() => useSurveyListState(DEFAULT_OPTIONS));

    const titles = result.current.filteredSurveys.map((s) => s.title);

    expect(titles).toEqual([
      'Alpha Survey',
      'Bravo Survey',
      'Charlie Survey',
      'Delta Survey',
      'Echo Survey',
      'Foxtrot Survey',
      'Golf Survey',
      'Hotel Survey',
      'India Survey',
      'Juliet Survey',
      'Kilo Survey',
    ]);
  });

  it('should filter surveys by search query matching title', () => {
    const { result } = renderHook(() => useSurveyListState(DEFAULT_OPTIONS));

    act(() => {
      result.current.setSearchQuery('alpha');
    });

    expect(result.current.filteredSurveys).toHaveLength(1);
    expect(result.current.filteredSurveys[0]!.title).toBe('Alpha Survey');
  });

  it('should filter surveys by search query matching description', () => {
    const { result } = renderHook(() => useSurveyListState(DEFAULT_OPTIONS));

    act(() => {
      result.current.setSearchQuery('Description for Bravo');
    });

    expect(result.current.filteredSurveys).toHaveLength(1);
    expect(result.current.filteredSurveys[0]!.title).toBe('Bravo Survey');
  });

  it('should reset page to 1 when search query changes', () => {
    const { result } = renderHook(() =>
      useSurveyListState({ ...DEFAULT_OPTIONS, defaultPerPage: 5 })
    );

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

  it('should reset page to 1 when sort changes', () => {
    const { result } = renderHook(() =>
      useSurveyListState({ ...DEFAULT_OPTIONS, defaultPerPage: 5 })
    );

    act(() => {
      result.current.pagination.goToPage(2);
    });

    act(() => {
      result.current.setSortBy('title');
    });

    expect(result.current.pagination.page).toBe(1);
  });

  it('should paginate surveys correctly', () => {
    const { result } = renderHook(() =>
      useSurveyListState({ ...DEFAULT_OPTIONS, defaultPerPage: 5 })
    );

    expect(result.current.paginatedSurveys).toHaveLength(5);
    expect(result.current.pagination.totalPages).toBe(3);
    expect(result.current.pagination.totalItems).toBe(11);
    expect(result.current.pagination.canGoNext).toBe(true);
    expect(result.current.pagination.canGoPrev).toBe(false);
  });

  it('should navigate to next page', () => {
    const { result } = renderHook(() =>
      useSurveyListState({ ...DEFAULT_OPTIONS, defaultPerPage: 5 })
    );

    act(() => {
      result.current.pagination.nextPage();
    });

    expect(result.current.pagination.page).toBe(2);
    expect(result.current.paginatedSurveys).toHaveLength(5);
  });

  it('should navigate to previous page', () => {
    const { result } = renderHook(() =>
      useSurveyListState({ ...DEFAULT_OPTIONS, defaultPerPage: 5 })
    );

    act(() => {
      result.current.pagination.goToPage(3);
    });

    act(() => {
      result.current.pagination.prevPage();
    });

    expect(result.current.pagination.page).toBe(2);
  });

  it('should clamp page when filter narrows results', () => {
    const { result } = renderHook(() =>
      useSurveyListState({ ...DEFAULT_OPTIONS, defaultPerPage: 5 })
    );

    act(() => {
      result.current.pagination.goToPage(3);
    });

    // Searching narrows to 1 result → totalPages=1 → page clamped to 1
    act(() => {
      result.current.setSearchQuery('Alpha');
    });

    expect(result.current.pagination.page).toBe(1);
  });

  it('should apply preFilter before other filters', () => {
    const preFilter = (s: UserSurvey) => s.title.startsWith('A') || s.title.startsWith('B');

    const { result } = renderHook(() => useSurveyListState({ ...DEFAULT_OPTIONS, preFilter }));

    expect(result.current.filteredSurveys).toHaveLength(2);
    expect(
      result.current.filteredSurveys.every(
        (s) => s.title.startsWith('A') || s.title.startsWith('B')
      )
    ).toBe(true);
  });

  it('should toggle sort direction via handleSortByColumn for the same key', () => {
    const { result } = renderHook(() => useSurveyListState(DEFAULT_OPTIONS));

    // Default sort for 'title' is 'asc'
    expect(result.current.sortDir).toBe('asc');

    act(() => {
      result.current.handleSortByColumn('title');
    });

    expect(result.current.sortDir).toBe('desc');
  });

  it('should change perPage and reset to page 1', () => {
    const { result } = renderHook(() =>
      useSurveyListState({ ...DEFAULT_OPTIONS, defaultPerPage: 10 })
    );

    act(() => {
      result.current.pagination.goToPage(2);
    });

    act(() => {
      result.current.pagination.setPerPage(5);
    });

    expect(result.current.pagination.perPage).toBe(5);
    expect(result.current.pagination.page).toBe(1);
  });
});
