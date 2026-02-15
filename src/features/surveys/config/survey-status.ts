import { Archive, Ban, CheckCircle2, CircleDot, FilePen, RotateCcw, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { SurveyStatus } from '@/features/surveys/types';

// ── Status visual config ────────────────────────────────────────────

interface StatusBadgeConfig {
  variant: 'default' | 'secondary' | 'outline';
  className: string;
  showPulseDot: boolean;
}

interface StatusConfig {
  labelKey: string;
  icon: LucideIcon;
  badge: StatusBadgeConfig;
}

/** Maps each survey status to its icon, i18n label key, and badge styling. */
export const SURVEY_STATUS_CONFIG: Record<SurveyStatus, StatusConfig> = {
  draft: {
    labelKey: 'surveys.dashboard.status.draft',
    icon: FilePen,
    badge: { variant: 'secondary', className: '', showPulseDot: false },
  },
  active: {
    labelKey: 'surveys.dashboard.status.active',
    icon: CircleDot,
    badge: {
      variant: 'default',
      className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
      showPulseDot: false,
    },
  },
  closed: {
    labelKey: 'surveys.dashboard.status.closed',
    icon: CheckCircle2,
    badge: {
      variant: 'outline',
      className: 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/25',
      showPulseDot: false,
    },
  },
  cancelled: {
    labelKey: 'surveys.dashboard.status.cancelled',
    icon: Ban,
    badge: {
      variant: 'outline',
      className: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25',
      showPulseDot: false,
    },
  },
  archived: {
    labelKey: 'surveys.dashboard.status.archived',
    icon: Archive,
    badge: {
      variant: 'outline',
      className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25',
      showPulseDot: false,
    },
  },
};

/** Returns badge variant, className, and pulse-dot flag for a given status. */
export function getStatusBadgeProps(status: SurveyStatus) {
  return SURVEY_STATUS_CONFIG[status].badge;
}

// ── State machine ───────────────────────────────────────────────────

interface StatusTransition {
  method: 'update' | 'delete';
  toStatus?: SurveyStatus | null;
  fromStatuses: readonly SurveyStatus[];
}

/** Survey state-machine: maps action names to their target status and valid source statuses. */
export const SURVEY_TRANSITIONS = {
  close: { method: 'update', toStatus: 'closed', fromStatuses: ['active'] },
  cancel: { method: 'update', toStatus: 'cancelled', fromStatuses: ['active'] },
  archive: {
    method: 'update',
    toStatus: 'archived',
    fromStatuses: ['closed', 'cancelled', 'draft'],
  },
  restore: { method: 'update', toStatus: 'draft', fromStatuses: ['archived'] },
  delete: { method: 'delete', fromStatuses: ['draft', 'archived'] },
} as const satisfies Record<string, StatusTransition>;

export type SurveyAction = keyof typeof SURVEY_TRANSITIONS;

/** Checks if a given action is valid from the current status. */
export function canTransition(from: SurveyStatus, action: SurveyAction): boolean {
  return (SURVEY_TRANSITIONS[action].fromStatuses as readonly string[]).includes(from);
}

/** Returns all valid actions that can be performed on a survey with the given status. */
export function getAvailableActions(status: SurveyStatus): SurveyAction[] {
  return (Object.keys(SURVEY_TRANSITIONS) as SurveyAction[]).filter((action) =>
    canTransition(status, action)
  );
}

// ── Derived status flags ─────────────────────────────────────────────

/** Boolean flags derived from a survey's current status. */
export interface SurveyStatusFlags {
  isDraft: boolean;
  isActive: boolean;
  isClosed: boolean;
  isCancelled: boolean;
  isArchived: boolean;
}

/** Derives boolean convenience flags from a survey's current status. */
export function deriveSurveyFlags(status: SurveyStatus): SurveyStatusFlags {
  return {
    isDraft: status === 'draft',
    isActive: status === 'active',
    isClosed: status === 'closed',
    isCancelled: status === 'cancelled',
    isArchived: status === 'archived',
  };
}

// ── Action UI config (icons, toasts, confirmation dialogs) ──────────

/** UI metadata for a survey action (icon, toast key, optional confirmation dialog). */
export interface ActionUIConfig {
  icon: LucideIcon;
  toastKey: string;
  /** Button color in the detail panel: 'destructive' (red), 'warning' (amber), 'accent' (violet), or undefined (neutral). */
  buttonColor?: 'destructive' | 'warning' | 'accent';
  confirm?: {
    titleKey: string;
    descriptionKey: string;
    variant: 'default' | 'warning' | 'destructive' | 'accent';
  };
}

/** Maps each survey action to its icon, toast key, and optional confirmation dialog config. */
export const SURVEY_ACTION_UI: Record<SurveyAction, ActionUIConfig> = {
  close: {
    icon: CheckCircle2,
    toastKey: 'toast.closed',
    buttonColor: 'accent',
    confirm: {
      titleKey: 'confirm.closeTitle',
      descriptionKey: 'confirm.closeDescription',
      variant: 'accent',
    },
  },
  cancel: {
    icon: Ban,
    toastKey: 'toast.cancelled',
    buttonColor: 'destructive',
    confirm: {
      titleKey: 'confirm.cancelTitle',
      descriptionKey: 'confirm.cancelDescription',
      variant: 'destructive',
    },
  },
  archive: {
    icon: Archive,
    toastKey: 'toast.archived',
    buttonColor: 'warning',
    confirm: {
      titleKey: 'confirm.archiveTitle',
      descriptionKey: 'confirm.archiveDescription',
      variant: 'warning',
    },
  },
  restore: {
    icon: RotateCcw,
    toastKey: 'toast.restored',
    confirm: {
      titleKey: 'confirm.restoreTitle',
      descriptionKey: 'confirm.restoreDescription',
      variant: 'default',
    },
  },
  delete: {
    icon: Trash2,
    toastKey: 'toast.deleted',
    buttonColor: 'destructive',
    confirm: {
      titleKey: 'confirm.deleteTitle',
      descriptionKey: 'confirm.deleteDescription',
      variant: 'destructive',
    },
  },
};
