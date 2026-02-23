'use client';

import { useTranslations } from 'next-intl';

import { COMPACT_ACTION_BASE } from '@/components/ui/action-button-styles';
import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/ui/metric-display';
import { PROJECT_ACTION_UI } from '@/features/projects/config/status';
import { cn } from '@/lib/common/utils';

interface ProjectActionButtonsProps {
  isArchived: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function ProjectActionButtons({
  isArchived,
  onEdit,
  onArchive,
  onDelete,
}: ProjectActionButtonsProps) {
  const t = useTranslations();
  const EditIcon = PROJECT_ACTION_UI.edit.icon;
  const archiveAction = isArchived ? 'restore' : 'archive';
  const ArchiveIcon = PROJECT_ACTION_UI[archiveAction].icon;
  const DeleteIcon = PROJECT_ACTION_UI.delete.icon;

  return (
    <>
      <SectionLabel>{t('projects.detail.actionsLabel')}</SectionLabel>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <EditIcon className="size-4" aria-hidden />
          {t('projects.list.actions.edit')}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className={cn(COMPACT_ACTION_BASE, PROJECT_ACTION_UI[archiveAction].buttonClassName)}
          onClick={onArchive}
        >
          <ArchiveIcon className="size-3.5" aria-hidden />
          {t(`projects.list.actions.${archiveAction}`)}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={cn(COMPACT_ACTION_BASE, PROJECT_ACTION_UI.delete.buttonClassName)}
          onClick={onDelete}
        >
          <DeleteIcon className="size-3.5" aria-hidden />
          {t('projects.list.actions.delete')}
        </Button>
      </div>
    </>
  );
}
