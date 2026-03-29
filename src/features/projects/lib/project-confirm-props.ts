import type { ProjectAction } from '@/features/projects/config/status';
import type { MessageKey } from '@/i18n/types';

type ConfirmVariant = 'default' | 'destructive' | 'warning' | 'accent' | 'success';

export interface ProjectConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  variant: ConfirmVariant;
}

/** Maps each project action to its matching confirm button variant. */
const ACTION_VARIANT: Record<ProjectAction, ConfirmVariant> = {
  complete: 'accent',
  trash: 'destructive',
  restoreTrash: 'default',
  permanentDelete: 'destructive',
};

/**
 * Shared confirm-dialog props for project status-change actions.
 * Used by both the project list page and project dashboard page.
 */
export function getProjectConfirmDialogProps(
  action: ProjectAction,
  t: (key: MessageKey) => string
): ProjectConfirmDialogProps {
  const key = `projects.list.confirm.${action}`;

  return {
    title: t(`${key}Title` as MessageKey),
    description: t(`${key}Description` as MessageKey),
    confirmLabel: t(`${key}Action` as MessageKey),
    variant: ACTION_VARIANT[action],
  };
}
