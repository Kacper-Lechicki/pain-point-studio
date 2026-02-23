import {
  Archive,
  BarChart3,
  ClipboardList,
  FolderKanban,
  FolderOpen,
  Home,
  LayoutTemplate,
  Lightbulb,
  type LucideIcon,
  Plug,
  Plus,
  Settings,
} from 'lucide-react';

import type { AppRoute } from '@/config/routes';
import { ROUTES } from '@/config/routes';
import type { MessageKey } from '@/i18n/types';

// ── Sub-panel item (child route) ──────────────────────────────────────

export interface SubNavItem {
  labelKey: MessageKey;
  icon: LucideIcon;
  href: AppRoute;
  /** URL hash (without #) for same-path sections, e.g. settings#profile. */
  hash?: string | undefined;
  /** Query params appended to href, e.g. { status: 'active' }. */
  searchParams?: Record<string, string> | undefined;
  /** Additional pathnames that should highlight this item as active. */
  alsoActiveFor?: readonly string[] | undefined;
  /** Whether the item is disabled (not clickable, dimmed). */
  disabled?: boolean | undefined;
}

// ── Optional group heading for sub-panel items ────────────────────────

export interface SubNavGroup {
  headingKey?: MessageKey | undefined;
  items: SubNavItem[];
}

// ── Sub-panel configuration for a main nav item ──────────────────────

export interface SubNavConfig {
  titleKey: MessageKey;
  groups: SubNavGroup[];
}

// ── Main nav item ─────────────────────────────────────────────────────

export interface NavItem {
  labelKey: MessageKey;
  icon: LucideIcon;
  href: AppRoute;
  /**
   * Path prefix used for active-state matching instead of `href`.
   * Useful when `href` points to a specific sub-page but the whole
   * section (e.g. `/dashboard/analytics/*`) should highlight as active.
   */
  activePrefix?: string | undefined;
  subNav?: SubNavConfig | undefined;
  disabled?: boolean | undefined;
}

export interface NavGroup {
  items: NavItem[];
}

// ── Constants ─────────────────────────────────────────────────────────

export const SIDEBAR_NAV: NavGroup[] = [
  {
    items: [
      { labelKey: 'sidebar.home', icon: Home, href: ROUTES.common.dashboard },
      {
        labelKey: 'sidebar.projects',
        icon: FolderKanban,
        href: ROUTES.dashboard.projects,
        subNav: {
          titleKey: 'sidebar.projects',
          groups: [
            {
              items: [
                {
                  labelKey: 'sidebar.allProjects',
                  icon: FolderKanban,
                  href: ROUTES.dashboard.projects,
                },
                {
                  labelKey: 'sidebar.newProject',
                  icon: Plus,
                  href: ROUTES.dashboard.projectNew,
                },
              ],
            },
          ],
        },
      },
      {
        labelKey: 'sidebar.research',
        icon: Lightbulb,
        href: ROUTES.dashboard.research,
        subNav: {
          titleKey: 'sidebar.research',
          groups: [
            {
              items: [
                {
                  labelKey: 'sidebar.allSurveys',
                  icon: ClipboardList,
                  href: ROUTES.dashboard.research,
                },
                {
                  labelKey: 'sidebar.newSurvey',
                  icon: Plus,
                  href: ROUTES.dashboard.researchNew,
                },
                {
                  // Not yet implemented — will move to ROUTES when route exists
                  labelKey: 'sidebar.templates',
                  icon: LayoutTemplate,
                  href: '/dashboard/research/templates' as AppRoute,
                  disabled: true,
                },
              ],
            },
            {
              headingKey: 'sidebar.organizeHeading',
              items: [
                {
                  // Not yet implemented — will move to ROUTES when route exists
                  labelKey: 'sidebar.folders',
                  icon: FolderOpen,
                  href: '/dashboard/research/folders' as AppRoute,
                  disabled: true,
                },
                {
                  labelKey: 'sidebar.archive',
                  icon: Archive,
                  href: ROUTES.dashboard.researchArchive,
                },
              ],
            },
            {
              headingKey: 'sidebar.configureHeading',
              items: [
                {
                  // Not yet implemented — will move to ROUTES when route exists
                  labelKey: 'sidebar.surveySettings',
                  icon: Settings,
                  href: '/dashboard/research/settings' as AppRoute,
                  disabled: true,
                },
                {
                  // Not yet implemented — will move to ROUTES when route exists
                  labelKey: 'sidebar.integrations',
                  icon: Plug,
                  href: '/dashboard/research/integrations' as AppRoute,
                  disabled: true,
                },
              ],
            },
          ],
        },
      },
      {
        labelKey: 'sidebar.analytics',
        icon: BarChart3,
        href: ROUTES.dashboard.analyticsProjectIdea,
        activePrefix: ROUTES.dashboard.analytics,
        subNav: {
          titleKey: 'sidebar.analytics',
          groups: [
            {
              items: [
                {
                  labelKey: 'sidebar.projectIdeaEvaluation',
                  icon: ClipboardList,
                  href: ROUTES.dashboard.analyticsProjectIdea,
                },
              ],
            },
          ],
        },
      },
    ],
  },
];

export const SIDEBAR_BOTTOM_ITEM: NavItem = {
  labelKey: 'sidebar.projectSettings',
  icon: Settings,
  href: '/project-settings' as AppRoute,
  disabled: true,
};

// ── Re-exports for backward compatibility ─────────────────────────────
// NOTE: findActiveNavItem is in lib/nav-utils.ts (not re-exported to avoid circular deps)

export { USER_SETTINGS_NAV_ITEM, USER_SETTINGS_SUB_NAV_ITEMS } from './navigation-settings';
export type { DynamicRouteTab, DynamicSidebarItem } from './navigation-dynamic';
export { DYNAMIC_ROUTE_TABS, DYNAMIC_SIDEBAR_ITEMS } from './navigation-dynamic';
