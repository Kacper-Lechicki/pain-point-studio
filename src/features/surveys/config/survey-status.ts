import { Archive, Ban, CheckCircle2, CircleDot, FilePen, RotateCcw, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { COMPACT_ACTION_COLORS } from '@/components/ui/action-button-styles';
import type { SurveyStatus } from '@/features/surveys/types';
import type { StatusBadgeConfig, StatusTransition } from '@/lib/common/status-machine';
import {
  KPI_COLOR_ALL,
  canTransition as genericCanTransition,
  getAvailableActions as genericGetAvailableActions,
} from '@/lib/common/status-machine';

export { KPI_COLOR_ALL };

// ── Status visual config ────────────────────────────────────────────

interface StatusConfig {
  labelKey: string;
  descriptionKey: string;
  ariaLabelKey: string;
  icon: LucideIcon;
  badge: StatusBadgeConfig;
  kpiColor: string;
}

/** Maps each survey status to its icon, i18n label key, and badge styling. */
export const SURVEY_STATUS_CONFIG: Record<SurveyStatus, StatusConfig> = {
  draft: {
    labelKey: 'surveys.dashboard.status.draft',
    descriptionKey: 'surveys.dashboard.statusInfo.draft',
    ariaLabelKey: 'surveys.dashboard.statusInfo.ariaLabel',
    icon: FilePen,
    badge: { variant: 'secondary', className: '', showPulseDot: false },
    kpiColor: 'text-foreground',
  },
  active: {
    labelKey: 'surveys.dashboard.status.active',
    descriptionKey: 'surveys.dashboard.statusInfo.active',
    ariaLabelKey: 'surveys.dashboard.statusInfo.ariaLabel',
    icon: CircleDot,
    badge: {
      variant: 'default',
      className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
      showPulseDot: false,
    },
    kpiColor: 'text-emerald-600 dark:text-emerald-400',
  },
  completed: {
    labelKey: 'surveys.dashboard.status.completed',
    descriptionKey: 'surveys.dashboard.statusInfo.completed',
    ariaLabelKey: 'surveys.dashboard.statusInfo.ariaLabel',
    icon: CheckCircle2,
    badge: {
      variant: 'outline',
      className: 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/25',
      showPulseDot: false,
    },
    kpiColor: 'text-violet-600 dark:text-violet-400',
  },
  cancelled: {
    labelKey: 'surveys.dashboard.status.cancelled',
    descriptionKey: 'surveys.dashboard.statusInfo.cancelled',
    ariaLabelKey: 'surveys.dashboard.statusInfo.ariaLabel',
    icon: Ban,
    badge: {
      variant: 'outline',
      className: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25',
      showPulseDot: false,
    },
    kpiColor: 'text-red-600 dark:text-red-400',
  },
  archived: {
    labelKey: 'surveys.dashboard.status.archived',
    descriptionKey: 'surveys.dashboard.statusInfo.archived',
    ariaLabelKey: 'surveys.dashboard.statusInfo.ariaLabel',
    icon: Archive,
    badge: {
      variant: 'outline',
      className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25',
      showPulseDot: false,
    },
    kpiColor: 'text-foreground',
  },
  trashed: {
    labelKey: 'surveys.dashboard.status.trashed',
    descriptionKey: 'surveys.dashboard.statusInfo.trashed',
    ariaLabelKey: 'surveys.dashboard.statusInfo.ariaLabel',
    icon: Trash2,
    badge: {
      variant: 'outline',
      className: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25',
      showPulseDot: false,
    },
    kpiColor: 'text-red-600 dark:text-red-400',
  },
};

// ── State machine ───────────────────────────────────────────────────

/** Survey state-machine: maps action names to their target status and valid source statuses. */
export const SURVEY_TRANSITIONS = {
  complete: { method: 'update', toStatus: 'completed', fromStatuses: ['active'] },
  cancel: { method: 'update', toStatus: 'cancelled', fromStatuses: ['active'] },
  reopen: { method: 'update', toStatus: 'active', fromStatuses: ['completed', 'cancelled'] },
  archive: {
    method: 'update',
    toStatus: 'archived',
    fromStatuses: ['completed', 'cancelled', 'draft'],
  },
  restore: { method: 'update', toStatus: null, fromStatuses: ['archived'] },
  trash: {
    method: 'update',
    toStatus: 'trashed',
    fromStatuses: ['draft', 'active', 'completed', 'cancelled', 'archived'],
  },
  restoreTrash: { method: 'update', toStatus: null, fromStatuses: ['trashed'] },
  permanentDelete: { method: 'delete', fromStatuses: ['trashed'] },
} as const satisfies Record<string, StatusTransition<SurveyStatus>>;

export type SurveyAction = keyof typeof SURVEY_TRANSITIONS;

/** Checks if a given action is valid from the current status. */
export function canTransition(from: SurveyStatus, action: SurveyAction): boolean {
  return genericCanTransition(from, action, SURVEY_TRANSITIONS);
}

/** Returns all valid actions that can be performed on a survey with the given status. */
export function getAvailableActions(status: SurveyStatus): SurveyAction[] {
  return genericGetAvailableActions<SurveyStatus, SurveyAction>(status, SURVEY_TRANSITIONS);
}

// ── Derived status flags ─────────────────────────────────────────────

/** Boolean flags derived from a survey's current status. */
export interface SurveyStatusFlags {
  isDraft: boolean;
  isActive: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  isArchived: boolean;
  isTrashed: boolean;
}

/** Derives boolean convenience flags from a survey's current status. */
export function deriveSurveyFlags(status: SurveyStatus): SurveyStatusFlags {
  return {
    isDraft: status === 'draft',
    isActive: status === 'active',
    isCompleted: status === 'completed',
    isCancelled: status === 'cancelled',
    isArchived: status === 'archived',
    isTrashed: status === 'trashed',
  };
}

// ── Action UI config (icons, toasts, confirmation dialogs) ──────────

/** UI metadata for a survey action (icon, toast key, optional confirmation dialog). */
interface ActionUIConfig {
  icon: LucideIcon;
  toastKey: string;
  /** Pre-mapped Tailwind classes for the action button in the detail panel. */
  buttonClassName?: string;
  /** Variant for `DropdownMenuItem` in action menus. */
  menuItemVariant?: 'destructive' | 'warning' | 'accent';
  confirm?: {
    titleKey: string;
    descriptionKey: string;
    variant: 'default' | 'warning' | 'destructive' | 'accent';
  };
}

/** Maps each survey action to its icon, toast key, and optional confirmation dialog config. */
export const SURVEY_ACTION_UI: Record<SurveyAction, ActionUIConfig> = {
  complete: {
    icon: CheckCircle2,
    toastKey: 'toast.completed',
    buttonClassName: COMPACT_ACTION_COLORS.complete,
    menuItemVariant: 'accent',
    confirm: {
      titleKey: 'confirm.completeTitle',
      descriptionKey: 'confirm.completeDescription',
      variant: 'accent',
    },
  },
  cancel: {
    icon: Ban,
    toastKey: 'toast.cancelled',
    buttonClassName: COMPACT_ACTION_COLORS.destructive,
    menuItemVariant: 'destructive',
    confirm: {
      titleKey: 'confirm.cancelTitle',
      descriptionKey: 'confirm.cancelDescription',
      variant: 'destructive',
    },
  },
  reopen: {
    icon: RotateCcw,
    toastKey: 'toast.reopened',
    buttonClassName: COMPACT_ACTION_COLORS.restore,
    confirm: {
      titleKey: 'confirm.reopenTitle',
      descriptionKey: 'confirm.reopenDescription',
      variant: 'default',
    },
  },
  archive: {
    icon: Archive,
    toastKey: 'toast.archived',
    buttonClassName: COMPACT_ACTION_COLORS.archive,
    menuItemVariant: 'warning',
    confirm: {
      titleKey: 'confirm.archiveTitle',
      descriptionKey: 'confirm.archiveDescription',
      variant: 'warning',
    },
  },
  restore: {
    icon: RotateCcw,
    toastKey: 'toast.restored',
    buttonClassName: COMPACT_ACTION_COLORS.restore,
    confirm: {
      titleKey: 'confirm.restoreTitle',
      descriptionKey: 'confirm.restoreDescription',
      variant: 'default',
    },
  },
  trash: {
    icon: Trash2,
    toastKey: 'toast.trashed',
    buttonClassName: COMPACT_ACTION_COLORS.destructive,
    menuItemVariant: 'destructive',
    confirm: {
      titleKey: 'confirm.trashTitle',
      descriptionKey: 'confirm.trashDescription',
      variant: 'destructive',
    },
  },
  restoreTrash: {
    icon: RotateCcw,
    toastKey: 'toast.restoredFromTrash',
    buttonClassName: COMPACT_ACTION_COLORS.restore,
    confirm: {
      titleKey: 'confirm.restoreTrashTitle',
      descriptionKey: 'confirm.restoreTrashDescription',
      variant: 'default',
    },
  },
  permanentDelete: {
    icon: Trash2,
    toastKey: 'toast.permanentlyDeleted',
    buttonClassName: COMPACT_ACTION_COLORS.destructive,
    menuItemVariant: 'destructive',
    confirm: {
      titleKey: 'confirm.permanentDeleteTitle',
      descriptionKey: 'confirm.permanentDeleteDescription',
      variant: 'destructive',
    },
  },
};
