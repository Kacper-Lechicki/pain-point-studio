import { Archive, CheckCircle2, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { COMPACT_ACTION_COLORS } from '@/components/ui/action-button-styles';
import type { ProjectStatus } from '@/features/projects/types';

// ── Status visual config ────────────────────────────────────────────

export interface StatusBadgeConfig {
  variant: 'default' | 'secondary' | 'outline';
  className: string;
}

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
};

/** KPI text color for the "all" total (not tied to a specific status). */
export const KPI_COLOR_ALL = 'text-foreground';

// ── State machine ───────────────────────────────────────────────────

interface StatusTransition {
  method: 'update' | 'delete';
  toStatus?: ProjectStatus | null;
  fromStatuses: readonly ProjectStatus[];
}

/** Project state-machine: maps action names to their target status and valid source statuses. */
export const PROJECT_TRANSITIONS = {
  archive: { method: 'update', toStatus: 'archived', fromStatuses: ['active'] },
  restore: { method: 'update', toStatus: 'active', fromStatuses: ['archived'] },
  delete: { method: 'delete', fromStatuses: ['archived'] },
} as const satisfies Record<string, StatusTransition>;

export type ProjectAction = keyof typeof PROJECT_TRANSITIONS;

/** Checks if a given action is valid from the current project status. */
export function canTransition(from: ProjectStatus, action: ProjectAction): boolean {
  return (PROJECT_TRANSITIONS[action].fromStatuses as readonly string[]).includes(from);
}

/** Returns all valid actions for a project with the given status. */
export function getAvailableActions(status: ProjectStatus): ProjectAction[] {
  return (Object.keys(PROJECT_TRANSITIONS) as ProjectAction[]).filter((action) =>
    canTransition(status, action)
  );
}

// ── Action UI config ────────────────────────────────────────────────

export interface ProjectActionUIConfig {
  icon: LucideIcon;
  buttonClassName?: string;
  menuItemVariant?: 'destructive' | 'warning';
}

/** Maps each project action to its icon and button styling. */
export const PROJECT_ACTION_UI: Record<ProjectAction | 'edit', ProjectActionUIConfig> = {
  edit: {
    icon: Pencil,
  },
  archive: {
    icon: Archive,
    buttonClassName: COMPACT_ACTION_COLORS.archive,
    menuItemVariant: 'warning',
  },
  restore: {
    icon: RotateCcw,
    buttonClassName: COMPACT_ACTION_COLORS.restore,
  },
  delete: {
    icon: Trash2,
    buttonClassName: COMPACT_ACTION_COLORS.destructive,
    menuItemVariant: 'destructive',
  },
};
