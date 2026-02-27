'use client';

import { useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { archiveProject } from '@/features/projects/actions/archive-project';
import { deleteProject } from '@/features/projects/actions/delete-project';
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import {
  type ProjectConfirmDialogProps,
  getProjectConfirmDialogProps,
} from '@/features/projects/lib/project-confirm-props';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';

type ConfirmAction = {
  type: 'archive' | 'delete';
  project: ProjectWithMetrics;
};

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

  const archiveAction = useFormAction({
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const deleteAction = useFormAction({
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

    const { type, project } = confirmAction;

    if (type === 'archive') {
      const isArchived = isProjectArchived(project);
      const successMsg = (
        isArchived ? 'projects.list.restoreSuccess' : 'projects.list.archiveSuccess'
      ) as MessageKey;

      setLocalProjects((prev) =>
        prev.map((p) =>
          p.id === project.id
            ? {
                ...p,
                status: (isArchived ? 'active' : 'archived') as ProjectWithMetrics['status'],
                archived_at: isArchived ? null : new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : p
        )
      );
      setConfirmAction(null);

      const result = await archiveAction.execute(archiveProject, { projectId: project.id });

      if (result && !result.error) {
        const { toast } = await import('sonner');
        toast.success(t(successMsg));
      } else {
        setLocalProjects((prev) =>
          prev.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  status: project.status,
                  archived_at: project.archived_at,
                  updated_at: project.updated_at,
                }
              : p
          )
        );
      }
    } else {
      setLocalProjects((prev) => prev.filter((p) => p.id !== project.id));
      setConfirmAction(null);

      if (selectedId === project.id) {
        setSelected(null);
      }

      const result = await deleteAction.execute(deleteProject, { projectId: project.id });

      if (result && !result.error) {
        const { toast } = await import('sonner');
        toast.success(t('projects.list.deleteSuccess' as MessageKey));
      } else {
        setLocalProjects((prev) => [...prev, project]);
      }
    }
  };

  const confirmDialogProps: ProjectConfirmDialogProps | null = useMemo(() => {
    if (!confirmAction) {
      return null;
    }

    const { type, project } = confirmAction;

    return getProjectConfirmDialogProps(type, isProjectArchived(project), t);
  }, [confirmAction, t]);

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
