import {
  Archive,
  BarChart3,
  CircleUserRound,
  ClipboardList,
  FolderOpen,
  Home,
  KeyRound,
  LayoutTemplate,
  Link2,
  type LucideIcon,
  Mail,
  Palette,
  Plug,
  Plus,
  Settings,
  Trash2,
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
                  labelKey: 'sidebar.newSurvey',
                  icon: Plus,
                  href: '/dashboard/surveys/new' as AppRoute,
                },
                {
                  labelKey: 'sidebar.allSurveys',
                  icon: ClipboardList,
                  href: '/dashboard/surveys' as AppRoute,
                },
                {
                  labelKey: 'sidebar.templates',
                  icon: LayoutTemplate,
                  href: '/dashboard/surveys/templates' as AppRoute,
                  disabled: true,
                },
              ],
            },
            {
              headingKey: 'sidebar.organizeHeading',
              items: [
                {
                  labelKey: 'sidebar.folders',
                  icon: FolderOpen,
                  href: '/dashboard/surveys/folders' as AppRoute,
                  disabled: true,
                },
                {
                  labelKey: 'sidebar.archive',
                  icon: Archive,
                  href: '/dashboard/surveys/archive' as AppRoute,
                },
              ],
            },
            {
              headingKey: 'sidebar.configureHeading',
              items: [
                {
                  labelKey: 'sidebar.surveySettings',
                  icon: Settings,
                  href: '/dashboard/surveys/settings' as AppRoute,
                  disabled: true,
                },
                {
                  labelKey: 'sidebar.integrations',
                  icon: Plug,
                  href: '/dashboard/surveys/integrations' as AppRoute,
                  disabled: true,
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

const SETTINGS_SUB_NAV_ITEMS: SubNavItem[] = [
  { labelKey: 'settings.nav.profile', icon: CircleUserRound, href: ROUTES.settings.profile },
  { labelKey: 'settings.nav.email', icon: Mail, href: ROUTES.settings.email },
  { labelKey: 'settings.nav.password', icon: KeyRound, href: ROUTES.settings.password },
  { labelKey: 'settings.nav.appearance', icon: Palette, href: ROUTES.settings.appearance },
  {
    labelKey: 'settings.nav.connectedAccounts',
    icon: Link2,
    href: ROUTES.settings.connectedAccounts,
  },
  { labelKey: 'settings.nav.dangerZone', icon: Trash2, href: ROUTES.settings.dangerZone },
];

export const SIDEBAR_BOTTOM_ITEM: NavItem = {
  labelKey: 'sidebar.settings',
  icon: Settings,
  href: ROUTES.common.settings,
  subNav: {
    titleKey: 'settings.title',
    groups: [{ items: SETTINGS_SUB_NAV_ITEMS }],
  },
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

  if (
    (pathname === SIDEBAR_BOTTOM_ITEM.href ||
      pathname.startsWith(SIDEBAR_BOTTOM_ITEM.href + '/')) &&
    SIDEBAR_BOTTOM_ITEM.subNav
  ) {
    return SIDEBAR_BOTTOM_ITEM;
  }

  return undefined;
}

/**
 * Determine whether the current pathname should show the sub-panel.
 */
export function hasSubNavForPath(pathname: string): boolean {
  return findActiveNavItem(pathname) !== undefined;
}
