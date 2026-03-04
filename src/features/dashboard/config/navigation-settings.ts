import {
  CircleUserRound,
  KeyRound,
  Link2,
  Mail,
  MessageSquareShare,
  Settings,
  Trash2,
} from 'lucide-react';

import { ROUTES } from '@/config/routes';
import type { NavItem, SubNavItem } from '@/features/dashboard/config/navigation';

/** Profile preview link shown in the sidebar above Settings. */
export const PROFILE_NAV_ITEM: NavItem = {
  labelKey: 'sidebar.profilePreview',
  icon: CircleUserRound,
  href: ROUTES.profile.preview,
};

const USER_SETTINGS_SUB_NAV_ITEMS: SubNavItem[] = [
  { labelKey: 'settings.nav.profile', icon: CircleUserRound, href: ROUTES.settings.profile },
  { labelKey: 'settings.nav.email', icon: Mail, href: ROUTES.settings.email },
  { labelKey: 'settings.nav.password', icon: KeyRound, href: ROUTES.settings.password },
  {
    labelKey: 'settings.nav.connectedAccounts',
    icon: Link2,
    href: ROUTES.settings.connectedAccounts,
  },
  { labelKey: 'settings.nav.dangerZone', icon: Trash2, href: ROUTES.settings.dangerZone },
];

/**
 * Nav item for user account settings. Shown as the sidebar bottom item
 * and also returned by `findActiveNavItem` so the sub-panel renders
 * when the user navigates to /settings/* via the user menu.
 */
export const USER_SETTINGS_NAV_ITEM: NavItem = {
  labelKey: 'sidebar.settings',
  icon: Settings,
  href: ROUTES.settings.profile,
  activePrefix: ROUTES.common.settings,
  subNav: {
    titleKey: 'settings.title',
    groups: [{ items: USER_SETTINGS_SUB_NAV_ITEMS }],
  },
};

/** Disabled "Share Feedback" item shown in the sidebar below Settings. */
export const GIVE_FEEDBACK_NAV_ITEM: NavItem = {
  labelKey: 'sidebar.shareFeedback',
  icon: MessageSquareShare,
  href: ROUTES.settings.profile,
  disabled: true,
};
