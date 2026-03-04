'use client';

import { useTranslations } from 'next-intl';

import {
  type BulkActionDescriptor,
  BulkActionBar as GenericBulkActionBar,
} from '@/components/ui/bulk-action-bar';
import { SURVEY_ACTION_UI } from '@/features/surveys/config/survey-status';
import type { BulkSurveyAction } from '@/features/surveys/hooks/use-survey-bulk-selection';
import type { MessageKey } from '@/i18n/types';

/** Outline colors for bulk action buttons: solid colored border + colored text. */
const BULK_BUTTON_COLORS: Record<BulkSurveyAction, string> = {
  complete:
    'border-violet-500 text-violet-600 hover:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/10',
  cancel: 'border-destructive text-destructive hover:bg-destructive/10',
  reopen:
    'border-emerald-500 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/10',
  archive:
    'border-amber-500 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/10',
  restore:
    'border-emerald-500 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/10',
  trash: 'border-destructive text-destructive hover:bg-destructive/10',
  restoreTrash:
    'border-emerald-500 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/10',
};

interface SurveyBulkActionBarProps {
  count: number;
  availableActions: BulkSurveyAction[];
  onAction: (action: BulkSurveyAction) => void;
  onClear: () => void;
  onSelectAll?: (() => void) | undefined;
  allOnPageSelected?: boolean | undefined;
}

export function SurveyBulkActionBar({
  count,
  availableActions,
  onAction,
  onClear,
  onSelectAll,
  allOnPageSelected,
}: SurveyBulkActionBarProps) {
  const t = useTranslations();

  const actions: BulkActionDescriptor[] = availableActions.map((action) => ({
    key: action,
    icon: SURVEY_ACTION_UI[action].icon,
    label: t(`surveys.dashboard.actions.${action}` as MessageKey),
    colorClassName: BULK_BUTTON_COLORS[action],
  }));

  return (
    <GenericBulkActionBar
      count={count}
      actions={actions}
      onAction={(key) => onAction(key as BulkSurveyAction)}
      onClear={onClear}
      onSelectAll={onSelectAll}
      allOnPageSelected={allOnPageSelected}
      selectAllLabel={t('surveys.dashboard.bulk.selectAll')}
      clearSelectionLabel={t('surveys.dashboard.bulk.clearSelection')}
    />
  );
}
