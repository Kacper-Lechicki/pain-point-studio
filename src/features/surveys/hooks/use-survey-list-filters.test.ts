// @vitest-environment jsdom
import { useState } from 'react';

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserSurvey } from '@/features/surveys/types';

import { SURVEY_LIST_COMPARATOR, useSurveyListFilters } from './use-survey-list-filters';

vi.mock('@/hooks/common/use-session-state', () => ({
  useSessionState: (_key: string, initial: unknown) => {
    const [state, setState] = useState(initial);

    return [state, setState];
  },
}));

vi.mock('@/features/surveys/config/survey-status', () => ({
  deriveSurveyFlags: (status: string) => ({
    isDraft: status === 'draft',
    isActive: status === 'active',
    isCompleted: status === 'completed',
    isTrashed: status === 'trashed',
  }),
}));

vi.mock('@/features/surveys/components/dashboard/survey-list-toolbar', () => ({
  NO_PROJECT_FILTER_ID: '__no_project__',
}));

// The hook checks `projectId === null` at runtime, so we allow null overrides.
function makeSurvey(overrides: Partial<Record<keyof UserSurvey, unknown>> = {}): UserSurvey {
  return {
    id: 's1',
    title: 'Survey',
    status: 'active',
    projectId: 'proj-default',
    projectName: 'Default Project',
    responseCount: 0,
    responseLimit: 100,
    lastResponseAt: null,
    recentActivity: [0, 0, 0, 0, 0, 0, 0],
    createdAt: '2024-01-01',
    slug: 'survey',
    ...overrides,
  } as UserSurvey;
}

describe('useSurveyListFilters', () => {
  const surveys = [
    makeSurvey({ id: 's1', status: 'active', projectId: 'proj1', projectName: 'Project A' }),
    makeSurvey({ id: 's2', status: 'draft', projectId: null, projectName: null }),
    makeSurvey({ id: 's3', status: 'completed', projectId: 'proj1', projectName: 'Project A' }),
    makeSurvey({ id: 's4', status: 'completed', projectId: 'proj2', projectName: 'Project B' }),
    makeSurvey({ id: 's5', status: 'trashed', projectId: null, projectName: null }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('preFilter (dashboard context)', () => {
    it('hides trashed when no status filter is active', () => {
      const { result } = renderHook(() => useSurveyListFilters(surveys));

      const visible = surveys.filter(result.current.preFilter);

      expect(visible.map((s) => s.id)).toEqual(['s1', 's2', 's3', 's4']);
    });

    it('shows only matching status when filter is active', () => {
      const { result } = renderHook(() => useSurveyListFilters(surveys));

      act(() => result.current.setStatusFilter(['draft']));

      const visible = surveys.filter(result.current.preFilter);

      expect(visible.map((s) => s.id)).toEqual(['s2']);
    });

    it('shows trashed when trashed filter is active', () => {
      const { result } = renderHook(() => useSurveyListFilters(surveys));

      act(() => result.current.setStatusFilter(['trashed']));

      const visible = surveys.filter(result.current.preFilter);

      expect(visible.map((s) => s.id)).toEqual(['s5']);
    });
  });

  describe('preFilter (project context)', () => {
    it('hides only trashed when no status filter', () => {
      const { result } = renderHook(() => useSurveyListFilters(surveys, { projectContext: true }));

      const visible = surveys.filter(result.current.preFilter);

      expect(visible.map((s) => s.id)).toEqual(['s1', 's2', 's3', 's4']);
    });
  });

  describe('project filter', () => {
    it('filters by project when project filter is active', () => {
      const { result } = renderHook(() => useSurveyListFilters(surveys));

      act(() => result.current.setProjectFilter(['proj1']));

      const visible = surveys.filter(result.current.preFilter);

      // s1 (active, proj1), s3 (completed, proj1)
      expect(visible.map((s) => s.id)).toEqual(['s1', 's3']);
    });

    it('filters for no-project surveys using NO_PROJECT_FILTER_ID', () => {
      const { result } = renderHook(() => useSurveyListFilters(surveys));

      act(() => result.current.setProjectFilter(['__no_project__']));

      const visible = surveys.filter(result.current.preFilter);

      // s2 (draft, no project) — s5 is trashed so hidden
      expect(visible.map((s) => s.id)).toEqual(['s2']);
    });

    it('ignores project filter in project context', () => {
      const { result } = renderHook(() => useSurveyListFilters(surveys, { projectContext: true }));

      act(() => result.current.setProjectFilter(['proj1']));

      const visible = surveys.filter(result.current.preFilter);

      // Project filter is ignored in project context
      expect(visible.length).toBe(4);
    });
  });

  describe('statusCounts', () => {
    it('counts all statuses in dashboard context', () => {
      const { result } = renderHook(() => useSurveyListFilters(surveys));

      expect(result.current.statusCounts).toEqual({
        active: 1,
        draft: 1,
        completed: 2,
        trashed: 1,
      });
    });

    it('counts all statuses in project context', () => {
      const { result } = renderHook(() => useSurveyListFilters(surveys, { projectContext: true }));

      expect(result.current.statusCounts).toEqual({
        active: 1,
        draft: 1,
        completed: 2,
        trashed: 1,
      });
    });
  });

  describe('projectOptions', () => {
    it('returns project options with counts in dashboard context', () => {
      const { result } = renderHook(() => useSurveyListFilters(surveys));

      const options = result.current.projectOptions;

      expect(options).toContainEqual({ id: 'proj1', name: 'Project A', count: 2 });
      expect(options).toContainEqual({ id: '__no_project__', name: '', count: 1 });
    });

    it('returns empty in project context', () => {
      const { result } = renderHook(() => useSurveyListFilters(surveys, { projectContext: true }));

      expect(result.current.projectOptions).toEqual([]);
    });

    it('excludes trashed surveys from project options', () => {
      const { result } = renderHook(() => useSurveyListFilters(surveys));

      // proj2 has s4 (completed) → included
      const proj2 = result.current.projectOptions.find((o) => o.id === 'proj2');

      expect(proj2).toEqual({ id: 'proj2', name: 'Project B', count: 1 });
    });
  });

  describe('kpiStatuses', () => {
    it('returns statuses that have counts > 0 in dashboard context', () => {
      const { result } = renderHook(() => useSurveyListFilters(surveys));

      expect(result.current.kpiStatuses).toEqual(['active', 'draft', 'completed']);
    });

    it('returns statuses that have counts > 0 in project context', () => {
      const { result } = renderHook(() => useSurveyListFilters(surveys, { projectContext: true }));

      expect(result.current.kpiStatuses).toEqual(['active', 'draft', 'completed']);
    });
  });

  describe('isFiltered', () => {
    it('returns false when no filters active', () => {
      const { result } = renderHook(() => useSurveyListFilters(surveys));

      expect(result.current.isFiltered).toBe(false);
    });

    it('returns true when status filter is active', () => {
      const { result } = renderHook(() => useSurveyListFilters(surveys));

      act(() => result.current.setStatusFilter(['active']));

      expect(result.current.isFiltered).toBe(true);
    });

    it('returns true when project filter is active in dashboard context', () => {
      const { result } = renderHook(() => useSurveyListFilters(surveys));

      act(() => result.current.setProjectFilter(['proj1']));

      expect(result.current.isFiltered).toBe(true);
    });

    it('project filter does not make isFiltered true in project context', () => {
      const { result } = renderHook(() => useSurveyListFilters(surveys, { projectContext: true }));

      act(() => result.current.setProjectFilter(['proj1']));

      expect(result.current.isFiltered).toBe(false);
    });
  });
});

describe('SURVEY_LIST_COMPARATOR', () => {
  const s1 = makeSurvey({ id: 's1', responseCount: 10 });
  const s2 = makeSurvey({ id: 's2', responseCount: 5 });

  it('sorts by responses ascending', () => {
    const cmp = SURVEY_LIST_COMPARATOR('responses', 'asc');

    expect(cmp!(s1, s2)).toBeGreaterThan(0);
    expect(cmp!(s2, s1)).toBeLessThan(0);
  });

  it('sorts by responses descending', () => {
    const cmp = SURVEY_LIST_COMPARATOR('responses', 'desc');

    expect(cmp!(s1, s2)).toBeLessThan(0);
    expect(cmp!(s2, s1)).toBeGreaterThan(0);
  });

  it('sorts by lastResponse date', () => {
    const a = makeSurvey({ id: 'a', title: 'A', lastResponseAt: '2024-06-01' });
    const b = makeSurvey({ id: 'b', title: 'B', lastResponseAt: '2024-01-01' });

    const cmp = SURVEY_LIST_COMPARATOR('lastResponse', 'desc');

    expect(cmp!(a, b)).toBeLessThan(0);
  });

  it('falls back to title for lastResponse ties', () => {
    const a = makeSurvey({ id: 'a', title: 'Alpha', lastResponseAt: null });
    const b = makeSurvey({ id: 'b', title: 'Beta', lastResponseAt: null });

    const cmp = SURVEY_LIST_COMPARATOR('lastResponse', 'asc');

    expect(cmp!(a, b)).toBeLessThan(0);
  });

  it('sorts by activity sum', () => {
    const a = makeSurvey({ id: 'a', title: 'A', recentActivity: [5, 3, 2, 0, 0, 0, 0] });
    const b = makeSurvey({ id: 'b', title: 'B', recentActivity: [1, 1, 0, 0, 0, 0, 0] });

    const cmp = SURVEY_LIST_COMPARATOR('activity', 'desc');

    expect(cmp!(a, b)).toBeLessThan(0); // a has more activity
  });

  it('returns undefined for unknown sort key', () => {
    const cmp = SURVEY_LIST_COMPARATOR('unknown' as never, 'asc');

    expect(cmp).toBeUndefined();
  });
});
