import { Archive, CheckCircle2, Pencil, RotateCcw, Trash2, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { COMPACT_ACTION_COLORS } from '@/components/ui/action-button-styles';
import type { ProjectStatus } from '@/features/projects/types';
import type { StatusBadgeConfig, StatusTransition } from '@/lib/common/status-machine';
import {
  KPI_COLOR_ALL,
  canTransition as genericCanTransition,
  getAvailableActions as genericGetAvailableActions,
} from '@/lib/common/status-machine';

export { KPI_COLOR_ALL };

// ── Status visual config ────────────────────────────────────────────

interface ProjectStatusConfig {
  labelKey: string;
  descriptionKey: string;
  ariaLabelKey: string;
  icon: LucideIcon;
  badge: StatusBadgeConfig;
  kpiColor: string;
}

/** Maps each project status to its visual config (icon, badge, i18n keys). */
export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, ProjectStatusConfig> = {
  active: {
    labelKey: 'projects.list.status.active',
    descriptionKey: 'projects.statusInfo.active',
    ariaLabelKey: 'projects.statusInfo.ariaLabel',
    icon: CheckCircle2,
    badge: {
      variant: 'default',
      className: 'border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    },
    kpiColor: 'text-emerald-600 dark:text-emerald-400',
  },
  completed: {
    labelKey: 'projects.list.status.completed',
    descriptionKey: 'projects.statusInfo.completed',
    ariaLabelKey: 'projects.statusInfo.ariaLabel',
    icon: Trophy,
    badge: {
      variant: 'default',
      className: 'border-violet-500/25 bg-violet-500/15 text-violet-700 dark:text-violet-400',
    },
    kpiColor: 'text-violet-600 dark:text-violet-400',
  },
  archived: {
    labelKey: 'projects.list.status.archived',
    descriptionKey: 'projects.statusInfo.archived',
    ariaLabelKey: 'projects.statusInfo.ariaLabel',
    icon: Archive,
    badge: {
      variant: 'outline',
      className: 'border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-400',
    },
    kpiColor: 'text-amber-600 dark:text-amber-400',
  },
  trashed: {
    labelKey: 'projects.list.status.trashed',
    descriptionKey: 'projects.statusInfo.trashed',
    ariaLabelKey: 'projects.statusInfo.ariaLabel',
    icon: Trash2,
    badge: {
      variant: 'outline',
      className: 'border-red-500/25 bg-red-500/15 text-red-700 dark:text-red-400',
    },
    kpiColor: 'text-red-600 dark:text-red-400',
  },
};

// ── State machine ───────────────────────────────────────────────────

/** Project state-machine: maps action names to their target status and valid source statuses. */
export const PROJECT_TRANSITIONS = {
  complete: { method: 'update', toStatus: 'completed', fromStatuses: ['active'] },
  archive: { method: 'update', toStatus: 'archived', fromStatuses: ['active', 'completed'] },
  reopen: { method: 'update', toStatus: 'active', fromStatuses: ['completed'] },
  /** toStatus is null — the actual status comes from pre_archive_status (resolved in RPC). */
  restore: { method: 'update', toStatus: null, fromStatuses: ['archived'] },
  trash: {
    method: 'update',
    toStatus: 'trashed',
    fromStatuses: ['active', 'completed', 'archived'],
  },
  restoreTrash: { method: 'update', toStatus: null, fromStatuses: ['trashed'] },
  permanentDelete: { method: 'delete', fromStatuses: ['trashed'] },
} as const satisfies Record<string, StatusTransition<ProjectStatus>>;

export type ProjectAction = keyof typeof PROJECT_TRANSITIONS;

/** Checks if a given action is valid from the current project status. */
export function canTransition(from: ProjectStatus, action: ProjectAction): boolean {
  return genericCanTransition(from, action, PROJECT_TRANSITIONS);
}

/** Returns all valid actions for a project with the given status. */
export function getAvailableActions(status: ProjectStatus): ProjectAction[] {
  return genericGetAvailableActions<ProjectStatus, ProjectAction>(status, PROJECT_TRANSITIONS);
}

// ── Action UI config ────────────────────────────────────────────────

interface ProjectActionUIConfig {
  icon: LucideIcon;
  buttonClassName?: string;
  menuItemVariant?: 'destructive' | 'warning' | 'accent';
}

/** Maps each project action to its icon and button styling. */
export const PROJECT_ACTION_UI: Record<ProjectAction | 'edit', ProjectActionUIConfig> = {
  edit: {
    icon: Pencil,
  },
  complete: {
    icon: Trophy,
    buttonClassName: COMPACT_ACTION_COLORS.complete,
    menuItemVariant: 'accent',
  },
  archive: {
    icon: Archive,
    buttonClassName: COMPACT_ACTION_COLORS.archive,
    menuItemVariant: 'warning',
  },
  reopen: {
    icon: RotateCcw,
    buttonClassName: COMPACT_ACTION_COLORS.restore,
  },
  restore: {
    icon: RotateCcw,
    buttonClassName: COMPACT_ACTION_COLORS.restore,
  },
  trash: {
    icon: Trash2,
    buttonClassName: COMPACT_ACTION_COLORS.destructive,
    menuItemVariant: 'destructive',
  },
  restoreTrash: {
    icon: RotateCcw,
    buttonClassName: COMPACT_ACTION_COLORS.restore,
  },
  permanentDelete: {
    icon: Trash2,
    buttonClassName: COMPACT_ACTION_COLORS.destructive,
    menuItemVariant: 'destructive',
  },
};
