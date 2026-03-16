'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

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

const PROJECT_TOAST_KEY: Record<ProjectAction, MessageKey> = {
  complete: 'projects.toast.completed' as MessageKey,
  archive: 'projects.toast.archived' as MessageKey,
  reopen: 'projects.toast.reopened' as MessageKey,
  restore: 'projects.toast.restored' as MessageKey,
  trash: 'projects.toast.trashed' as MessageKey,
  restoreTrash: 'projects.toast.restoredFromTrash' as MessageKey,
  permanentDelete: 'projects.toast.permanentlyDeleted' as MessageKey,
};

interface UseProjectDashboardActionsParams {
  initialProject: Project;
}

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

export function useProjectDashboardActions({ initialProject }: UseProjectDashboardActionsParams) {
  const t = useTranslations();
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [confirmAction, setConfirmAction] = useState<ProjectAction | null>(null);

  const statusAction = useFormAction({
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const handleConfirm = async () => {
    if (!confirmAction) {
      return;
    }

    if (confirmAction === 'permanentDelete') {
      setConfirmAction(null);

      const result = await statusAction.execute(permanentDeleteProject, {
        projectId: project.id,
      });

      if (result && !result.error) {
        toast.success(t(PROJECT_TOAST_KEY.permanentDelete));
        router.push(ROUTES.dashboard.projects);
      }

      return;
    }

    setProject((prev) => applyOptimisticUpdate(prev, confirmAction));
    setConfirmAction(null);

    const result = await statusAction.execute(changeProjectStatus, {
      projectId: project.id,
      action: confirmAction,
    });

    if (result?.error) {
      setProject(initialProject);
    } else {
      toast.success(t(PROJECT_TOAST_KEY[confirmAction]));
    }
  };

  const confirmDialogProps: ProjectConfirmDialogProps | null = (() => {
    if (!confirmAction) {
      return null;
    }

    return getProjectConfirmDialogProps(confirmAction, t);
  })();

  return {
    project,
    confirmAction,
    setConfirmAction,
    handleConfirm,
    confirmDialogProps,
  };
}
