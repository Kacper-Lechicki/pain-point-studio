'use client';

import { useTranslations } from 'next-intl';

import { COMPACT_ACTION_BASE } from '@/components/ui/action-button-styles';
import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/ui/metric-display';
import type { ProjectAction } from '@/features/projects/config/status';
import { PROJECT_ACTION_UI, getAvailableActions } from '@/features/projects/config/status';
import { isProjectReadOnly } from '@/features/projects/lib/project-helpers';
import type { ProjectStatus } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface ProjectActionButtonsProps {
  status: ProjectStatus;
  onEdit: () => void;
  onAction: (action: ProjectAction) => void;
}

export function ProjectActionButtons({ status, onEdit, onAction }: ProjectActionButtonsProps) {
  const t = useTranslations();
  const readOnly = isProjectReadOnly(status);
  const EditIcon = PROJECT_ACTION_UI.edit.icon;
  const actions = getAvailableActions(status);

  return (
    <>
      <SectionLabel>{t('projects.detail.actionsLabel')}</SectionLabel>

      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <EditIcon className="size-4" aria-hidden />
            {t('projects.list.actions.edit')}
          </Button>
        </div>
      )}

      <div className={cn(!readOnly && 'mt-3', 'flex flex-wrap gap-1.5')}>
        {actions.map((action) => {
          const ui = PROJECT_ACTION_UI[action];
          const Icon = ui.icon;

          return (
            <Button
              key={action}
              variant="outline"
              size="sm"
              className={cn(COMPACT_ACTION_BASE, ui.buttonClassName)}
              onClick={() => onAction(action)}
            >
              <Icon className="size-3.5" aria-hidden />
              {t(`projects.list.actions.${action}` as MessageKey)}
            </Button>
          );
        })}
      </div>
    </>
  );
}
