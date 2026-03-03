// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';

import { useProjectBulkSelection } from './use-project-bulk-selection';

vi.mock('@/features/projects/config/status', () => ({
  getAvailableActions: (status: string) => {
    const map: Record<string, string[]> = {
      active: ['complete', 'archive', 'trash'],
      completed: ['reopen', 'archive', 'trash'],
      trashed: ['restoreTrash', 'permanentDelete'],
    };

    return map[status] ?? [];
  },
}));

function makeProject(overrides: Partial<ProjectWithMetrics> = {}): ProjectWithMetrics {
  return {
    id: 'p1',
    name: 'Project 1',
    status: 'active',
    user_id: 'u1',
    summary: null,
    image_url: null,
    target_responses: 100,
    completed_at: null,
    archived_at: null,
    deleted_at: null,
    pre_archive_status: null,
    pre_trash_status: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    surveyCount: 0,
    totalResponses: 0,
    activeSurveys: 0,
    insightCount: 0,
    latestActivity: null,
    ...overrides,
  } as ProjectWithMetrics;
}

describe('useProjectBulkSelection', () => {
  const projects = [
    makeProject({ id: 'p1', status: 'active' }),
    makeProject({ id: 'p2', status: 'active' }),
    makeProject({ id: 'p3', status: 'completed' }),
  ];

  it('starts with empty selection', () => {
    const { result } = renderHook(() => useProjectBulkSelection(projects));

    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.selectionCount).toBe(0);
  });

  it('toggleSelect adds and removes items', () => {
    const { result } = renderHook(() => useProjectBulkSelection(projects));

    act(() => result.current.toggleSelect('p1'));

    expect(result.current.selectedIds.has('p1')).toBe(true);
    expect(result.current.selectionCount).toBe(1);

    act(() => result.current.toggleSelect('p1'));

    expect(result.current.selectedIds.has('p1')).toBe(false);
    expect(result.current.selectionCount).toBe(0);
  });

  it('selectAll selects all filtered projects', () => {
    const { result } = renderHook(() => useProjectBulkSelection(projects));

    act(() => result.current.selectAll(projects));

    expect(result.current.selectionCount).toBe(3);
  });

  it('clearSelection empties the selection', () => {
    const { result } = renderHook(() => useProjectBulkSelection(projects));

    act(() => result.current.selectAll(projects));
    act(() => result.current.clearSelection());

    expect(result.current.selectionCount).toBe(0);
  });

  it('returns empty availableBulkActions when nothing selected', () => {
    const { result } = renderHook(() => useProjectBulkSelection(projects));

    expect(result.current.availableBulkActions).toEqual([]);
  });

  it('returns intersection of actions for selected projects with same status', () => {
    const { result } = renderHook(() => useProjectBulkSelection(projects));

    act(() => {
      result.current.toggleSelect('p1');
      result.current.toggleSelect('p2');
    });

    // Both active → intersection is [complete, archive, trash]
    expect(result.current.availableBulkActions).toEqual(
      expect.arrayContaining(['complete', 'archive', 'trash'])
    );
  });

  it('computes intersection of actions across different statuses', () => {
    const { result } = renderHook(() => useProjectBulkSelection(projects));

    act(() => {
      result.current.toggleSelect('p1'); // active: complete, archive, trash
      result.current.toggleSelect('p3'); // completed: reopen, archive, trash
    });

    // Intersection: archive, trash
    const actions = result.current.availableBulkActions;

    expect(actions).toContain('archive');
    expect(actions).toContain('trash');
    expect(actions).not.toContain('complete');
    expect(actions).not.toContain('reopen');
  });

  it('excludes permanentDelete from bulk actions', () => {
    const trashedProjects = [
      makeProject({ id: 't1', status: 'trashed' }),
      makeProject({ id: 't2', status: 'trashed' }),
    ];
    const { result } = renderHook(() => useProjectBulkSelection(trashedProjects));

    act(() => result.current.selectAll(trashedProjects));

    expect(result.current.availableBulkActions).not.toContain('permanentDelete');
    expect(result.current.availableBulkActions).toContain('restoreTrash');
  });

  it('returns empty actions when selected projects no longer exist in list', () => {
    const { result } = renderHook(() => useProjectBulkSelection(projects));

    act(() => result.current.toggleSelect('nonexistent'));

    expect(result.current.availableBulkActions).toEqual([]);
  });
});
