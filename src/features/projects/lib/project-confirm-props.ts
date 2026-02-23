import type { MessageKey } from '@/i18n/types';

export interface ProjectConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  variant: 'default' | 'destructive';
}

/**
 * Shared confirm-dialog props for project archive/restore/delete actions.
 * Used by both the project list page and project dashboard page.
 */
export function getProjectConfirmDialogProps(
  type: 'archive' | 'delete',
  isArchived: boolean,
  t: (key: MessageKey) => string
): ProjectConfirmDialogProps {
  if (type === 'archive') {
    return {
      title: t(
        (isArchived
          ? 'projects.list.confirm.restoreTitle'
          : 'projects.list.confirm.archiveTitle') as MessageKey
      ),
      description: t(
        (isArchived
          ? 'projects.list.confirm.restoreDescription'
          : 'projects.list.confirm.archiveDescription') as MessageKey
      ),
      confirmLabel: t(
        (isArchived
          ? 'projects.list.confirm.restoreAction'
          : 'projects.list.confirm.archiveAction') as MessageKey
      ),
      variant: 'default',
    };
  }

  return {
    title: t('projects.list.confirm.deleteTitle' as MessageKey),
    description: t('projects.list.confirm.deleteDescription' as MessageKey),
    confirmLabel: t('projects.list.confirm.deleteAction' as MessageKey),
    variant: 'destructive',
  };
}
