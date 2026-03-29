'use client';

import { useTranslations } from 'next-intl';

import {
  type BulkActionDescriptor,
  BulkActionBar as GenericBulkActionBar,
} from '@/components/ui/bulk-action-bar';
import type { ProjectAction } from '@/features/projects/config/status';
import { PROJECT_ACTION_UI } from '@/features/projects/config/status';
import type { MessageKey } from '@/i18n/types';

/** Outline colors for bulk action buttons: solid colored border + colored text. */
const BULK_BUTTON_COLORS: Partial<Record<ProjectAction, string>> = {
  complete:
    'border-violet-500 text-violet-600 md:hover:bg-violet-500/10 dark:text-violet-400 dark:md:hover:bg-violet-500/10',
  trash:
    'border-red-500 text-red-600 md:hover:bg-red-500/10 dark:text-red-400 dark:md:hover:bg-red-500/10',
  restoreTrash:
    'border-emerald-500 text-emerald-600 md:hover:bg-emerald-500/10 dark:text-emerald-400 dark:md:hover:bg-emerald-500/10',
  permanentDelete:
    'border-red-500 text-red-600 md:hover:bg-red-500/10 dark:text-red-400 dark:md:hover:bg-red-500/10',
};

interface BulkActionBarProps {
  count: number;
  availableActions: ProjectAction[];
  onAction: (action: ProjectAction) => void;
  onClear: () => void;
  onSelectAll?: (() => void) | undefined;
  allOnPageSelected?: boolean | undefined;
}

export function BulkActionBar({
  count,
  availableActions,
  onAction,
  onClear,
  onSelectAll,
  allOnPageSelected,
}: BulkActionBarProps) {
  const t = useTranslations();

  const actions: BulkActionDescriptor[] = availableActions.map((action) => ({
    key: action,
    icon: PROJECT_ACTION_UI[action].icon,
    label: t(`projects.list.actions.${action}` as MessageKey),
    colorClassName: BULK_BUTTON_COLORS[action] ?? '',
  }));

  return (
    <GenericBulkActionBar
      count={count}
      actions={actions}
      onAction={(key) => onAction(key as ProjectAction)}
      onClear={onClear}
      onSelectAll={onSelectAll}
      allOnPageSelected={allOnPageSelected}
      selectAllLabel={t('projects.list.bulk.selectAll')}
      clearSelectionLabel={t('projects.list.bulk.clearSelection')}
    />
  );
}
