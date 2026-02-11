import { BarChart3, ClipboardList, Home, type LucideIcon, Plus, Settings } from 'lucide-react';

import type { AppRoute } from '@/config/routes';
import type { MessageKey } from '@/i18n/types';

// ── Sub-panel item (child route) ──────────────────────────────────────

export interface SubNavItem {
  labelKey: MessageKey;
  icon: LucideIcon;
  href: AppRoute;
  /** Additional pathnames that should highlight this item as active. */
  alsoActiveFor?: readonly string[] | undefined;
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
      { labelKey: 'sidebar.home', icon: Home, href: '/dashboard' as AppRoute },
      {
        labelKey: 'sidebar.surveys',
        icon: ClipboardList,
        href: '/dashboard/surveys' as AppRoute,
        subNav: {
          titleKey: 'surveys.title',
          groups: [
            {
              items: [
                {
                  labelKey: 'sidebar.allSurveys',
                  icon: ClipboardList,
                  href: '/dashboard/surveys' as AppRoute,
                },
                {
                  labelKey: 'sidebar.newSurvey',
                  icon: Plus,
                  href: '/dashboard/surveys/new' as AppRoute,
                  alsoActiveFor: ['/dashboard/surveys/create'],
                },
              ],
            },
          ],
        },
      },
      { labelKey: 'sidebar.analytics', icon: BarChart3, href: '/dashboard/analytics' as AppRoute },
    ],
  },
];

export const SIDEBAR_BOTTOM_ITEM: NavItem = {
  labelKey: 'sidebar.projectSettings',
  icon: Settings,
  href: '/settings' as AppRoute,
  disabled: true,
};

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Find the nav item whose href matches the current pathname or whose
 * sub-nav contains a matching child. Returns the NavItem if it has
 * subNav, otherwise undefined.
 */
export function findActiveNavItem(pathname: string): NavItem | undefined {
  for (const group of SIDEBAR_NAV) {
    for (const item of group.items) {
      if (!item.subNav) {
        continue;
      }

      if (pathname === item.href || pathname.startsWith(item.href + '/')) {
        return item;
      }
    }
  }

  return undefined;
}

/**
 * Determine whether the current pathname should show the sub-panel.
 */
export function hasSubNavForPath(pathname: string): boolean {
  return findActiveNavItem(pathname) !== undefined;
}
