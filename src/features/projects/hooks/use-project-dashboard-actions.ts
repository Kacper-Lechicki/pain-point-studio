'use client';

import { useCallback, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { ROUTES } from '@/config/routes';
import { archiveProject } from '@/features/projects/actions/archive-project';
import { deleteProject } from '@/features/projects/actions/delete-project';
import {
  type ProjectConfirmDialogProps,
  getProjectConfirmDialogProps,
} from '@/features/projects/lib/project-confirm-props';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { Project } from '@/features/projects/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import { useRouter } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';

type ConfirmAction = 'archive' | 'delete';

interface UseProjectDashboardActionsParams {
  initialProject: Project;
}

export function useProjectDashboardActions({ initialProject }: UseProjectDashboardActionsParams) {
  const t = useTranslations();
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const archiveAction = useFormAction({
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const deleteAction = useFormAction({
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

    if (confirmAction === 'archive') {
      const isArchived = isProjectArchived(project);

      const successMsg = (
        isArchived ? 'projects.detail.restoreSuccess' : 'projects.detail.archiveSuccess'
      ) as MessageKey;

      setProject((prev) => ({
        ...prev,
        status: isArchived ? 'active' : 'archived',
        archived_at: isArchived ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      setConfirmAction(null);

      const result = await archiveAction.execute(archiveProject, { projectId: project.id });

      if (result && !result.error) {
        const { toast } = await import('sonner');
        toast.success(t(successMsg));
      } else {
        setProject(initialProject);
      }
    } else {
      setConfirmAction(null);

      const result = await deleteAction.execute(deleteProject, { projectId: project.id });

      if (result && !result.error) {
        const { toast } = await import('sonner');
        toast.success(t('projects.detail.deleteSuccess' as MessageKey));
        router.push(ROUTES.dashboard.projects);
      }
    }
  }, [confirmAction, project, initialProject, archiveAction, deleteAction, t, router]);

  const confirmDialogProps: ProjectConfirmDialogProps | null = useMemo(() => {
    if (!confirmAction) {
      return null;
    }

    return getProjectConfirmDialogProps(confirmAction, isProjectArchived(project), t);
  }, [confirmAction, project, t]);

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
