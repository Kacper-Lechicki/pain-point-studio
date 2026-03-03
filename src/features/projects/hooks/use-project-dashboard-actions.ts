'use client';

import { useCallback, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { ROUTES } from '@/config/routes';
import { changeProjectStatus } from '@/features/projects/actions/change-project-status';
import { permanentDeleteProject } from '@/features/projects/actions/permanent-delete-project';
import type { ProjectAction } from '@/features/projects/config/status';
import {
  type ProjectConfirmDialogProps,
  getProjectConfirmDialogProps,
} from '@/features/projects/lib/project-confirm-props';
import type { Project } from '@/features/projects/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import { useRouter } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';

interface UseProjectDashboardActionsParams {
  initialProject: Project;
}

/** Maps each project action to its optimistic local state update. */
function applyOptimisticUpdate(prev: Project, action: ProjectAction): Project {
  const now = new Date().toISOString();

  switch (action) {
    case 'complete':
      return { ...prev, status: 'completed', completed_at: now, updated_at: now };
    case 'archive':
      return {
        ...prev,
        status: 'archived',
        archived_at: now,
        pre_archive_status: prev.status,
        updated_at: now,
      };
    case 'reopen':
      return { ...prev, status: 'active', completed_at: null, updated_at: now };
    case 'restore':
      return {
        ...prev,
        status: prev.pre_archive_status || 'active',
        archived_at: null,
        pre_archive_status: null,
        updated_at: now,
      };
    case 'trash':
      return {
        ...prev,
        status: 'trashed',
        deleted_at: now,
        pre_trash_status: prev.status,
        updated_at: now,
      };
    case 'restoreTrash':
      return {
        ...prev,
        status: prev.pre_trash_status || 'active',
        deleted_at: null,
        pre_trash_status: null,
        updated_at: now,
      };
    default:
      return prev;
  }
}

/** Toast message key for each project action. */
const ACTION_SUCCESS_KEYS: Record<ProjectAction, string> = {
  complete: 'projects.detail.completeSuccess',
  archive: 'projects.detail.archiveSuccess',
  reopen: 'projects.detail.reopenSuccess',
  restore: 'projects.detail.restoreSuccess',
  trash: 'projects.detail.trashSuccess',
  restoreTrash: 'projects.detail.restoreTrashSuccess',
  permanentDelete: 'projects.detail.permanentDeleteSuccess',
};

export function useProjectDashboardActions({ initialProject }: UseProjectDashboardActionsParams) {
  const t = useTranslations();
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ProjectAction | null>(null);

  const statusAction = useFormAction({
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const handleEditSuccess = useCallback(
    (data: { name: string; summary: string | undefined; targetResponses?: number | undefined }) => {
      setProject((prev) => ({
        ...prev,
        name: data.name,
        summary: data.summary ?? null,
        ...(data.targetResponses != null && { target_responses: data.targetResponses }),
        updated_at: new Date().toISOString(),
      }));
    },
    []
  );

  const handleImageChange = useCallback((url: string | null) => {
    setProject((prev) => ({
      ...prev,
      image_url: url,
      updated_at: new Date().toISOString(),
    }));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!confirmAction) {
      return;
    }

    if (confirmAction === 'permanentDelete') {
      setConfirmAction(null);

      const result = await statusAction.execute(permanentDeleteProject, {
        projectId: project.id,
      });

      if (result && !result.error) {
        const { toast } = await import('sonner');
        toast.success(t(ACTION_SUCCESS_KEYS.permanentDelete as MessageKey));
        router.push(ROUTES.dashboard.projects);
      }

      return;
    }

    // Optimistic update for status changes
    setProject((prev) => applyOptimisticUpdate(prev, confirmAction));
    setConfirmAction(null);

    const result = await statusAction.execute(changeProjectStatus, {
      projectId: project.id,
      action: confirmAction,
    });

    if (result && !result.error) {
      const { toast } = await import('sonner');
      toast.success(t(ACTION_SUCCESS_KEYS[confirmAction] as MessageKey));
    } else {
      // Revert on failure
      setProject(initialProject);
    }
  }, [confirmAction, project, initialProject, statusAction, t, router]);

  const confirmDialogProps: ProjectConfirmDialogProps | null = useMemo(() => {
    if (!confirmAction) {
      return null;
    }

    return getProjectConfirmDialogProps(confirmAction, t);
  }, [confirmAction, t]);

  return {
    project,
    editOpen,
    setEditOpen,
    confirmAction,
    setConfirmAction,
    handleEditSuccess,
    handleImageChange,
    handleConfirm,
    confirmDialogProps,
  };
}
