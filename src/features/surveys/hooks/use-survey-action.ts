'use client';

import { useState, useTransition } from 'react';

import type { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  archiveSurvey,
  cancelSurvey,
  completeSurvey,
  deleteSurveyDraft,
  restoreSurvey,
} from '@/features/surveys/actions';
import { SURVEY_ACTION_UI, type SurveyAction } from '@/features/surveys/config/survey-status';
import type { ActionResult } from '@/lib/common/types';

type T = ReturnType<typeof useTranslations>;

// ── Server action dispatch ──────────────────────────────────────────

const ACTION_FN: Record<SurveyAction, (data: { surveyId: string }) => Promise<ActionResult<void>>> =
  {
    complete: completeSurvey,
    cancel: cancelSurvey,
    archive: archiveSurvey,
    restore: restoreSurvey,
    delete: deleteSurveyDraft,
  };

// ── Confirmable actions ─────────────────────────────────────────────

type ConfirmableAction = Extract<
  SurveyAction,
  'complete' | 'cancel' | 'archive' | 'restore' | 'delete'
>;

export function isConfirmable(action: SurveyAction): action is ConfirmableAction {
  return SURVEY_ACTION_UI[action].confirm != null;
}

// ── Hook ────────────────────────────────────────────────────────────

interface UseSurveyActionReturn {
  isPending: boolean;
  confirmDialog: ConfirmableAction | null;
  setConfirmDialog: (action: ConfirmableAction | null) => void;
  handleActionClick: (action: SurveyAction) => void;
  confirmDialogProps: {
    open: true;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel: string;
    variant: 'default' | 'warning' | 'destructive' | 'accent';
  } | null;
}

export function useSurveyAction(
  surveyId: string,
  onStatusChange: (surveyId: string, action: string) => void,
  t: T
): UseSurveyActionReturn {
  const [isPending, startTransition] = useTransition();
  const [confirmDialog, setConfirmDialog] = useState<ConfirmableAction | null>(null);

  const executeAction = (action: SurveyAction) => {
    startTransition(async () => {
      const result = await ACTION_FN[action]({ surveyId });
      setConfirmDialog(null);

      if (result.success) {
        toast.success(
          t(`surveys.dashboard.${SURVEY_ACTION_UI[action].toastKey}` as Parameters<typeof t>[0])
        );
        onStatusChange(surveyId, action);
      } else {
        toast.error(t('surveys.dashboard.toast.actionFailed'));
      }
    });
  };

  const handleActionClick = (action: SurveyAction) => {
    if (isConfirmable(action)) {
      setConfirmDialog(action);
    } else {
      executeAction(action);
    }
  };

  const confirmDialogProps = confirmDialog
    ? {
        open: true as const,
        onOpenChange: (open: boolean) => !open && setConfirmDialog(null),
        onConfirm: () => executeAction(confirmDialog),
        title: t(
          `surveys.dashboard.${SURVEY_ACTION_UI[confirmDialog].confirm!.titleKey}` as Parameters<
            typeof t
          >[0]
        ),
        description: t(
          `surveys.dashboard.${SURVEY_ACTION_UI[confirmDialog].confirm!.descriptionKey}` as Parameters<
            typeof t
          >[0]
        ),
        confirmLabel: t(`surveys.dashboard.actions.${confirmDialog}`),
        variant: SURVEY_ACTION_UI[confirmDialog].confirm!.variant,
      }
    : null;

  return {
    isPending,
    confirmDialog,
    setConfirmDialog,
    handleActionClick,
    confirmDialogProps,
  };
}
