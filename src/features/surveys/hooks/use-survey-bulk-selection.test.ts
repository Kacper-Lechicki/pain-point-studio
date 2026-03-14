// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { UserSurvey } from '@/features/surveys/types';

import { useSurveyBulkSelection } from './use-survey-bulk-selection';

vi.mock('@/features/surveys/config/survey-status', () => ({
  getAvailableActions: (status: string) => {
    const map: Record<string, string[]> = {
      active: ['complete', 'cancel', 'trash'],
      draft: ['archive', 'trash'],
      completed: ['reopen', 'archive', 'trash'],
      trashed: ['restoreTrash', 'permanentDelete'],
    };

    return map[status] ?? [];
  },
}));

function makeSurvey(overrides: Partial<UserSurvey> = {}): UserSurvey {
  return {
    id: 's1',
    title: 'Survey 1',
    status: 'active',
    projectId: 'proj1',
    projectName: 'Project 1',
    responseCount: 0,
    targetResponses: 100,
    lastResponseAt: null,
    recentActivity: [],
    createdAt: '2024-01-01',
    slug: 'survey-1',
    ...overrides,
  } as UserSurvey;
}

describe('useSurveyBulkSelection', () => {
  const surveys = [
    makeSurvey({ id: 's1', status: 'active' }),
    makeSurvey({ id: 's2', status: 'active' }),
    makeSurvey({ id: 's3', status: 'draft' }),
  ];

  it('starts with empty selection', () => {
    const { result } = renderHook(() => useSurveyBulkSelection(surveys));

    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.selectionCount).toBe(0);
  });

  it('toggleSelect adds and removes items', () => {
    const { result } = renderHook(() => useSurveyBulkSelection(surveys));

    act(() => result.current.toggleSelect('s1'));

    expect(result.current.selectedIds.has('s1')).toBe(true);
    expect(result.current.selectionCount).toBe(1);

    act(() => result.current.toggleSelect('s1'));

    expect(result.current.selectedIds.has('s1')).toBe(false);
  });

  it('selectAll selects all filtered surveys', () => {
    const { result } = renderHook(() => useSurveyBulkSelection(surveys));

    act(() => result.current.selectAll(surveys));

    expect(result.current.selectionCount).toBe(3);
  });

  it('clearSelection empties the selection', () => {
    const { result } = renderHook(() => useSurveyBulkSelection(surveys));

    act(() => result.current.selectAll(surveys));
    act(() => result.current.clearSelection());

    expect(result.current.selectionCount).toBe(0);
  });

  it('returns empty availableBulkActions when nothing selected', () => {
    const { result } = renderHook(() => useSurveyBulkSelection(surveys));

    expect(result.current.availableBulkActions).toEqual([]);
  });

  it('returns intersection of actions for selected surveys with same status', () => {
    const { result } = renderHook(() => useSurveyBulkSelection(surveys));

    act(() => {
      result.current.toggleSelect('s1');
      result.current.toggleSelect('s2');
    });

    // Both active → [complete, cancel, trash]
    expect(result.current.availableBulkActions).toEqual(
      expect.arrayContaining(['complete', 'cancel', 'trash'])
    );
  });

  it('computes intersection of actions across different statuses', () => {
    const { result } = renderHook(() => useSurveyBulkSelection(surveys));

    act(() => {
      result.current.toggleSelect('s1'); // active: complete, cancel, trash
      result.current.toggleSelect('s3'); // draft: archive, trash
    });

    // Intersection: trash
    const actions = result.current.availableBulkActions;

    expect(actions).toContain('trash');
    expect(actions).not.toContain('complete');
    expect(actions).not.toContain('archive');
  });

  it('excludes permanentDelete from bulk actions', () => {
    const trashedSurveys = [
      makeSurvey({ id: 't1', status: 'trashed' }),
      makeSurvey({ id: 't2', status: 'trashed' }),
    ];
    const { result } = renderHook(() => useSurveyBulkSelection(trashedSurveys));

    act(() => result.current.selectAll(trashedSurveys));

    expect(result.current.availableBulkActions).not.toContain('permanentDelete');
    expect(result.current.availableBulkActions).toContain('restoreTrash');
  });

  it('returns empty actions when selected surveys no longer exist in list', () => {
    const { result } = renderHook(() => useSurveyBulkSelection(surveys));

    act(() => result.current.toggleSelect('nonexistent'));

    expect(result.current.availableBulkActions).toEqual([]);
  });
});
