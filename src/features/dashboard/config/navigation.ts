import { FlaskConical, FolderKanban, Home, type LucideIcon, Plus, Sparkles } from 'lucide-react';

import type { AppRoute } from '@/config/routes';
import { ROUTES } from '@/config/routes';
import type { MessageKey } from '@/i18n/types';

// ── Sub-panel item (child route) ──────────────────────────────────────

export interface SubNavItem {
  labelKey?: MessageKey | undefined;
  /** Plain string label for dynamic items (used instead of labelKey). */
  label?: string | undefined;
  icon: LucideIcon;
  href: AppRoute | string;
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
  /** Message shown when items array is empty (e.g. "No recently opened projects"). */
  emptyMessageKey?: MessageKey | undefined;
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
   * section (e.g. `/settings/*`) should highlight as active.
   */
  activePrefix?: string | undefined;
  /**
   * Extra path prefixes that should also activate this nav item.
   * Used when conceptually related routes live under different URL paths
   * (e.g. survey stats under `/dashboard/research/stats` still belong to Projects).
   */
  additionalPrefixes?: readonly string[] | undefined;
  subNav?: SubNavConfig | undefined;
  /** Show chevron when expanded (e.g. for items that will have sub-nav later). */
  showChevron?: boolean | undefined;
  disabled?: boolean | undefined;
}

interface NavGroup {
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
        additionalPrefixes: [ROUTES.dashboard.researchStats],
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
        labelKey: 'sidebar.standaloneResearch',
        icon: FlaskConical,
        href: ROUTES.common.dashboard,
        showChevron: true,
        disabled: true,
      },
      {
        labelKey: 'sidebar.askAi',
        icon: Sparkles,
        href: ROUTES.common.dashboard,
        disabled: true,
      },
    ],
  },
];

export { PROFILE_NAV_ITEM as SIDEBAR_PROFILE_ITEM } from '@/features/dashboard/config/navigation-settings';
export { USER_SETTINGS_NAV_ITEM as SIDEBAR_BOTTOM_ITEM } from '@/features/dashboard/config/navigation-settings';
export { GIVE_FEEDBACK_NAV_ITEM as SIDEBAR_GIVE_FEEDBACK_ITEM } from '@/features/dashboard/config/navigation-settings';

// ── Re-exports for backward compatibility ─────────────────────────────
// NOTE: findActiveNavItem is in lib/nav-utils.ts (not re-exported to avoid circular deps)

export type { DynamicRouteTab } from '@/features/dashboard/config/navigation-dynamic';
export {
  DYNAMIC_ROUTE_TABS,
  DYNAMIC_SIDEBAR_ITEMS,
} from '@/features/dashboard/config/navigation-dynamic';
