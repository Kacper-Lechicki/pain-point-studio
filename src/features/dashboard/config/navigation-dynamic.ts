import {
  BarChart3,
  CircleUserRound,
  ClipboardList,
  FolderKanban,
  type LucideIcon,
} from 'lucide-react';

import type { AppRoute } from '@/config/routes';
import { ROUTES } from '@/config/routes';
import type { MessageKey } from '@/i18n/types';

// ── Dynamic route tabs (sub-panel) ──────────────────────────────────

export interface DynamicRouteTab {
  prefix: string;
  icon: LucideIcon;
  /**
   * Segments immediately after `prefix` that should NOT activate this tab.
   * Used when `prefix` is broad (e.g. `/dashboard/research`) to avoid
   * matching known static child routes like `new`, `archive`, etc.
   */
  excludeSegments?: readonly string[] | undefined;
}

export const DYNAMIC_ROUTE_TABS: Record<string, DynamicRouteTab[]> = {
  [ROUTES.dashboard.research]: [
    { prefix: ROUTES.dashboard.researchStats, icon: BarChart3 },
    {
      prefix: ROUTES.dashboard.research,
      icon: ClipboardList,
      excludeSegments: ['new', 'archive', 'templates', 'folders', 'settings', 'integrations'],
    },
  ],
  [ROUTES.dashboard.projects]: [
    {
      prefix: ROUTES.dashboard.projects,
      icon: FolderKanban,
      excludeSegments: ['new'],
    },
  ],
};

// ── Dynamic sidebar items (main sidebar) ────────────────────────────

export interface DynamicSidebarItem {
  /** Path that, when matched exactly, shows this item in the sidebar. */
  path: AppRoute;
  labelKey: MessageKey;
  icon: LucideIcon;
}

/**
 * Routes that are not part of the static sidebar but should still
 * show a highlighted item when the user is on them.
 */
export const DYNAMIC_SIDEBAR_ITEMS: DynamicSidebarItem[] = [
  { path: ROUTES.profile.preview, labelKey: 'sidebar.profilePreview', icon: CircleUserRound },
];
