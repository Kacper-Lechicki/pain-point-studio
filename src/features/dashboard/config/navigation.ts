import { BarChart3, ClipboardList, Home, type LucideIcon, Settings } from 'lucide-react';

import type { AppRoute } from '@/config/routes';
import type { MessageKey } from '@/i18n/types';

export interface NavItem {
  labelKey: MessageKey;
  icon: LucideIcon;
  href: AppRoute;
}

export interface NavGroup {
  items: NavItem[];
}

export const SIDEBAR_NAV: NavGroup[] = [
  {
    items: [
      { labelKey: 'sidebar.home', icon: Home, href: '/dashboard' as AppRoute },
      { labelKey: 'sidebar.surveys', icon: ClipboardList, href: '/dashboard/surveys' as AppRoute },
      { labelKey: 'sidebar.analytics', icon: BarChart3, href: '/dashboard/analytics' as AppRoute },
    ],
  },
];

export const SIDEBAR_BOTTOM_ITEM: NavItem = {
  labelKey: 'sidebar.settings',
  icon: Settings,
  href: '/settings' as AppRoute,
};
