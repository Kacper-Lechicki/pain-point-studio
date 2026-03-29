// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Project } from '@/features/projects/types';

import { useProjectDashboardActions } from './use-project-dashboard-actions';

const mockChangeProjectStatus = vi.fn();
const mockPermanentDeleteProject = vi.fn();
const mockExecute = vi.fn();
const mockRouterPush = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push: mockRouterPush, refresh: vi.fn() }),
}));

vi.mock('@/config/routes', () => ({
  ROUTES: { dashboard: { projects: '/dashboard/projects' } },
}));

vi.mock('@/features/projects/actions/change-project-status', () => ({
  changeProjectStatus: (...args: unknown[]) => mockChangeProjectStatus(...args),
}));

vi.mock('@/features/projects/actions/permanent-delete-project', () => ({
  permanentDeleteProject: (...args: unknown[]) => mockPermanentDeleteProject(...args),
}));

vi.mock('@/hooks/common/use-form-action', () => ({
  useFormAction: () => ({ execute: mockExecute }),
}));

vi.mock('@/features/projects/lib/project-confirm-props', () => ({
  getProjectConfirmDialogProps: (action: string, t: (k: string) => string) => ({
    title: t(`projects.list.confirm.${action}Title`),
    description: t(`projects.list.confirm.${action}Description`),
    confirmLabel: t(`projects.list.confirm.${action}Action`),
    variant: action === 'trash' ? 'destructive' : 'default',
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}));

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'Test Project',
    user_id: 'u1',
    status: 'active',
    description: null,
    summary: null,
    image_url: null,
    response_limit: 100,
    completed_at: null,
    deleted_at: null,
    pre_trash_status: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
  };
}

describe('useProjectDashboardActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ error: null });
  });

  it('initializes with the provided project', () => {
    const project = makeProject();
    const { result } = renderHook(() => useProjectDashboardActions({ initialProject: project }));

    expect(result.current.project).toBe(project);
  });

  it('handleConfirm does nothing when no confirmAction is set', async () => {
    const { result } = renderHook(() =>
      useProjectDashboardActions({ initialProject: makeProject() })
    );

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('handleConfirm applies optimistic update for status changes', async () => {
    const { result } = renderHook(() =>
      useProjectDashboardActions({ initialProject: makeProject({ status: 'active' }) })
    );

    act(() => {
      result.current.setConfirmAction('complete');
    });

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(result.current.project.status).toBe('completed');
    expect(result.current.confirmAction).toBeNull();
  });

  it('handleConfirm reverts on failure', async () => {
    const initial = makeProject({ status: 'active' });

    mockExecute.mockResolvedValue({ error: 'Failed' });

    const { result } = renderHook(() => useProjectDashboardActions({ initialProject: initial }));

    act(() => {
      result.current.setConfirmAction('complete');
    });

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(result.current.project.status).toBe('active');
  });

  it('permanentDelete navigates to projects list on success', async () => {
    const { result } = renderHook(() =>
      useProjectDashboardActions({ initialProject: makeProject({ status: 'trashed' }) })
    );

    act(() => {
      result.current.setConfirmAction('permanentDelete');
    });

    await act(async () => {
      await result.current.handleConfirm();
    });

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard/projects');
    });
  });

  it('confirmDialogProps is null when no confirmAction', () => {
    const { result } = renderHook(() =>
      useProjectDashboardActions({ initialProject: makeProject() })
    );

    expect(result.current.confirmDialogProps).toBeNull();
  });

  it('confirmDialogProps is derived from confirmAction', () => {
    const { result } = renderHook(() =>
      useProjectDashboardActions({ initialProject: makeProject() })
    );

    act(() => {
      result.current.setConfirmAction('trash');
    });

    expect(result.current.confirmDialogProps).toEqual({
      title: 'projects.list.confirm.trashTitle',
      description: 'projects.list.confirm.trashDescription',
      confirmLabel: 'projects.list.confirm.trashAction',
      variant: 'destructive',
    });
  });
});
