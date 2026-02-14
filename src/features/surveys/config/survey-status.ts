import { Archive, CircleDot, FilePen, RotateCcw, SquareX, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { SurveyStatus } from '../types';

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
      showPulseDot: true,
    },
  },
  closed: {
    labelKey: 'surveys.dashboard.status.closed',
    icon: SquareX,
    badge: {
      variant: 'outline',
      className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25',
      showPulseDot: false,
    },
  },
  archived: {
    labelKey: 'surveys.dashboard.status.archived',
    icon: Archive,
    badge: { variant: 'secondary', className: 'opacity-60', showPulseDot: false },
  },
};

export function getStatusBadgeProps(status: SurveyStatus) {
  return SURVEY_STATUS_CONFIG[status].badge;
}

// ── State machine ───────────────────────────────────────────────────

interface StatusTransition {
  method: 'update' | 'delete';
  toStatus?: SurveyStatus;
  fromStatuses: readonly SurveyStatus[];
}

export const SURVEY_TRANSITIONS = {
  close: { method: 'update', toStatus: 'closed', fromStatuses: ['active'] },
  reopen: { method: 'update', toStatus: 'active', fromStatuses: ['closed'] },
  archive: { method: 'update', toStatus: 'archived', fromStatuses: ['closed'] },
  restore: { method: 'update', toStatus: 'closed', fromStatuses: ['archived'] },
  delete: { method: 'delete', fromStatuses: ['draft'] },
} as const satisfies Record<string, StatusTransition>;

export type SurveyAction = keyof typeof SURVEY_TRANSITIONS;

export function canTransition(from: SurveyStatus, action: SurveyAction): boolean {
  return (SURVEY_TRANSITIONS[action].fromStatuses as readonly string[]).includes(from);
}

export function getAvailableActions(status: SurveyStatus): SurveyAction[] {
  return (Object.keys(SURVEY_TRANSITIONS) as SurveyAction[]).filter((action) =>
    canTransition(status, action)
  );
}

// ── Action UI config (icons, toasts, confirmation dialogs) ──────────

export interface ActionUIConfig {
  icon: LucideIcon;
  toastKey: string;
  confirm?: {
    titleKey: string;
    descriptionKey: string;
    variant: 'default' | 'warning' | 'destructive';
  };
}

export const SURVEY_ACTION_UI: Record<SurveyAction, ActionUIConfig> = {
  close: {
    icon: SquareX,
    toastKey: 'toast.closed',
    confirm: {
      titleKey: 'confirm.closeTitle',
      descriptionKey: 'confirm.closeDescription',
      variant: 'destructive',
    },
  },
  reopen: {
    icon: RotateCcw,
    toastKey: 'toast.reopened',
  },
  archive: {
    icon: Archive,
    toastKey: 'toast.archived',
    confirm: {
      titleKey: 'confirm.archiveTitle',
      descriptionKey: 'confirm.archiveDescription',
      variant: 'warning',
    },
  },
  restore: {
    icon: RotateCcw,
    toastKey: 'toast.restored',
  },
  delete: {
    icon: Trash2,
    toastKey: 'toast.deleted',
    confirm: {
      titleKey: 'confirm.deleteTitle',
      descriptionKey: 'confirm.deleteDescription',
      variant: 'destructive',
    },
  },
};
