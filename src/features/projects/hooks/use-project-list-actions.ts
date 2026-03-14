'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { changeProjectStatus } from '@/features/projects/actions/change-project-status';
import { permanentDeleteProject } from '@/features/projects/actions/permanent-delete-project';
import type { ProjectAction } from '@/features/projects/config/status';
import {
  type ProjectConfirmDialogProps,
  getProjectConfirmDialogProps,
} from '@/features/projects/lib/project-confirm-props';
import type { ProjectWithMetrics } from '@/features/projects/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';

const PROJECT_TOAST_KEY: Record<ProjectAction, MessageKey> = {
  complete: 'projects.toast.completed' as MessageKey,
  archive: 'projects.toast.archived' as MessageKey,
  reopen: 'projects.toast.reopened' as MessageKey,
  restore: 'projects.toast.restored' as MessageKey,
  trash: 'projects.toast.trashed' as MessageKey,
  restoreTrash: 'projects.toast.restoredFromTrash' as MessageKey,
  permanentDelete: 'projects.toast.permanentlyDeleted' as MessageKey,
};

type ConfirmAction = {
  action: ProjectAction;
  project: ProjectWithMetrics;
};

/** Applies an optimistic status update to a project in the list. */
function applyOptimisticListUpdate(
  p: ProjectWithMetrics,
  action: ProjectAction
): ProjectWithMetrics {
  const now = new Date().toISOString();

  switch (action) {
    case 'complete':
      return { ...p, status: 'completed', completed_at: now, updated_at: now };
    case 'archive':
      return {
        ...p,
        status: 'archived',
        archived_at: now,
        pre_archive_status: p.status,
        updated_at: now,
      };
    case 'reopen':
      return { ...p, status: 'active', completed_at: null, updated_at: now };
    case 'restore':
      return {
        ...p,
        status: p.pre_archive_status || 'active',
        archived_at: null,
        pre_archive_status: null,
        updated_at: now,
      };
    case 'trash':
      return {
        ...p,
        status: 'trashed',
        deleted_at: now,
        pre_trash_status: p.status,
        updated_at: now,
      };
    case 'restoreTrash':
      return {
        ...p,
        status: p.pre_trash_status || 'active',
        deleted_at: null,
        pre_trash_status: null,
        updated_at: now,
      };
    default:
      return p;
  }
}

interface UseProjectListActionsParams {
  localProjects: ProjectWithMetrics[];
  setLocalProjects: React.Dispatch<React.SetStateAction<ProjectWithMetrics[]>>;
  selectedId: string | null;
  setSelected: (id: string | null) => void;
}

export function useProjectListActions({
  setLocalProjects,
  selectedId,
  setSelected,
}: UseProjectListActionsParams) {
  const t = useTranslations();

  const [editProject, setEditProject] = useState<ProjectWithMetrics | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const statusAction = useFormAction({
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const handleEditSuccess = (data: { name: string; summary: string | undefined }) => {
    if (!editProject) {
      return;
    }

    setLocalProjects((prev) =>
      prev.map((p) =>
        p.id === editProject.id
          ? {
              ...p,
              name: data.name,
              summary: data.summary ?? null,
              updated_at: new Date().toISOString(),
            }
          : p
      )
    );
  };

  const handleConfirm = async () => {
    if (!confirmAction) {
      return;
    }

    const { action, project } = confirmAction;

    if (action === 'permanentDelete') {
      // Remove from list immediately
      setLocalProjects((prev) => prev.filter((p) => p.id !== project.id));
      setConfirmAction(null);

      if (selectedId === project.id) {
        setSelected(null);
      }

      const result = await statusAction.execute(permanentDeleteProject, {
        projectId: project.id,
      });

      if (result?.error) {
        setLocalProjects((prev) => [...prev, project]);
      } else {
        toast.success(t(PROJECT_TOAST_KEY.permanentDelete));
      }

      return;
    }

    // Optimistic update for status changes
    setLocalProjects((prev) =>
      prev.map((p) => (p.id === project.id ? applyOptimisticListUpdate(p, action) : p))
    );
    setConfirmAction(null);

    const result = await statusAction.execute(changeProjectStatus, {
      projectId: project.id,
      action,
    });

    if (result?.error) {
      setLocalProjects((prev) =>
        prev.map((p) =>
          p.id === project.id
            ? {
                ...p,
                status: project.status,
                archived_at: project.archived_at,
                completed_at: project.completed_at,
                deleted_at: project.deleted_at,
                pre_trash_status: project.pre_trash_status,
                pre_archive_status: project.pre_archive_status,
                updated_at: project.updated_at,
              }
            : p
        )
      );
    } else {
      toast.success(t(PROJECT_TOAST_KEY[action]));
    }
  };

  const confirmDialogProps: ProjectConfirmDialogProps | null = (() => {
    if (!confirmAction) {
      return null;
    }

    return getProjectConfirmDialogProps(confirmAction.action, t);
  })();

  return {
    editProject,
    setEditProject,
    confirmAction,
    setConfirmAction,
    handleEditSuccess,
    handleConfirm,
    confirmDialogProps,
  };
}
