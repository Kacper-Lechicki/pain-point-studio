// @vitest-environment jsdom
import type React from 'react';

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProjectWithMetrics } from '@/features/projects/types';

import { useProjectListActions } from './use-project-list-actions';

const mockExecute = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/features/projects/actions/change-project-status', () => ({
  changeProjectStatus: vi.fn(),
}));

vi.mock('@/features/projects/actions/permanent-delete-project', () => ({
  permanentDeleteProject: vi.fn(),
}));

vi.mock('@/hooks/common/use-form-action', () => ({
  useFormAction: () => ({ execute: mockExecute }),
}));

vi.mock('@/features/projects/lib/project-confirm-props', () => ({
  getProjectConfirmDialogProps: (action: string, t: (k: string) => string) => ({
    title: t(`projects.list.confirm.${action}Title`),
    description: t(`projects.list.confirm.${action}Description`),
    confirmLabel: t(`projects.list.confirm.${action}Action`),
    variant: 'default',
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}));

function makeProject(overrides: Partial<ProjectWithMetrics> = {}): ProjectWithMetrics {
  return {
    id: 'p1',
    name: 'Test Project',
    user_id: 'u1',
    status: 'active',
    summary: null,
    image_url: null,
    response_limit: 100,
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
    latestActivity: null,
    ...overrides,
  } as ProjectWithMetrics;
}

describe('useProjectListActions', () => {
  let localProjects: ProjectWithMetrics[];
  let setLocalProjects: React.Dispatch<React.SetStateAction<ProjectWithMetrics[]>>;
  let setSelected: (id: string | null) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ error: null });

    localProjects = [makeProject({ id: 'p1' }), makeProject({ id: 'p2' })];

    // Simulate React setState by capturing the updater
    setLocalProjects = vi.fn((updater: React.SetStateAction<ProjectWithMetrics[]>) => {
      if (typeof updater === 'function') {
        localProjects = updater(localProjects);
      } else {
        localProjects = updater;
      }
    }) as unknown as React.Dispatch<React.SetStateAction<ProjectWithMetrics[]>>;
    setSelected = vi.fn() as unknown as (id: string | null) => void;
  });

  function renderListActions(selectedId: string | null = null) {
    return renderHook(() =>
      useProjectListActions({
        localProjects,
        setLocalProjects,
        selectedId,
        setSelected,
      })
    );
  }

  it('starts with no editProject and no confirmAction', () => {
    const { result } = renderListActions();

    expect(result.current.editProject).toBeNull();
    expect(result.current.confirmAction).toBeNull();
    expect(result.current.confirmDialogProps).toBeNull();
  });

  it('handleEditSuccess updates a project in the list', () => {
    const { result } = renderListActions();

    act(() => result.current.setEditProject(localProjects[0]!));

    act(() => {
      result.current.handleEditSuccess({ name: 'Updated Name', summary: 'Updated Summary' });
    });

    expect(setLocalProjects).toHaveBeenCalled();

    // Verify the update was applied
    const updatedProject = localProjects.find((p) => p.id === 'p1');

    expect(updatedProject?.name).toBe('Updated Name');
    expect(updatedProject?.summary).toBe('Updated Summary');
  });

  it('handleConfirm does nothing when no confirmAction is set', async () => {
    const { result } = renderListActions();

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('handleConfirm applies optimistic update for status change', async () => {
    const { result } = renderListActions();

    act(() => {
      result.current.setConfirmAction({
        action: 'complete',
        project: localProjects[0]!,
      });
    });

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(setLocalProjects).toHaveBeenCalled();

    const updated = localProjects.find((p) => p.id === 'p1');

    expect(updated?.status).toBe('completed');
  });

  it('handleConfirm reverts on failure for status changes', async () => {
    mockExecute.mockResolvedValue({ error: 'Failed' });

    const originalProject = localProjects[0]!;
    const { result } = renderListActions();

    act(() => {
      result.current.setConfirmAction({
        action: 'complete',
        project: originalProject,
      });
    });

    await act(async () => {
      await result.current.handleConfirm();
    });

    // setLocalProjects should have been called for both optimistic update and revert
    expect(setLocalProjects).toHaveBeenCalledTimes(2);

    const reverted = localProjects.find((p) => p.id === 'p1');

    expect(reverted?.status).toBe('active');
  });

  it('permanentDelete removes project from list', async () => {
    const { result } = renderListActions();

    act(() => {
      result.current.setConfirmAction({
        action: 'permanentDelete',
        project: localProjects[0]!,
      });
    });

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(localProjects.find((p) => p.id === 'p1')).toBeUndefined();
  });

  it('permanentDelete clears selection when the deleted project is selected', async () => {
    const { result } = renderListActions('p1');

    act(() => {
      result.current.setConfirmAction({
        action: 'permanentDelete',
        project: localProjects[0]!,
      });
    });

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(setSelected).toHaveBeenCalledWith(null);
  });

  it('permanentDelete reverts on failure', async () => {
    mockExecute.mockResolvedValue({ error: 'Failed' });

    const projectToDelete = localProjects[0]!;
    const { result } = renderListActions();

    act(() => {
      result.current.setConfirmAction({
        action: 'permanentDelete',
        project: projectToDelete,
      });
    });

    await act(async () => {
      await result.current.handleConfirm();
    });

    // Project should be added back
    expect(localProjects.some((p) => p.id === 'p1')).toBe(true);
  });

  it('confirmDialogProps is derived from confirmAction', () => {
    const { result } = renderListActions();

    act(() => {
      result.current.setConfirmAction({
        action: 'trash',
        project: localProjects[0]!,
      });
    });

    expect(result.current.confirmDialogProps).toEqual({
      title: 'projects.list.confirm.trashTitle',
      description: 'projects.list.confirm.trashDescription',
      confirmLabel: 'projects.list.confirm.trashAction',
      variant: 'default',
    });
  });

  it('confirmDialogProps is null when no confirmAction', () => {
    const { result } = renderListActions();

    expect(result.current.confirmDialogProps).toBeNull();
  });
});
