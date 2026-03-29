import {
  FolderKanban,
  Home,
  KeyRound,
  Link2,
  type LucideIcon,
  Mail,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react';

import type { AppRoute } from '@/config/routes';
import { ROUTES } from '@/config/routes';
import type { MessageKey } from '@/i18n/types';

interface SearchablePage {
  id: string;
  labelKey: MessageKey;
  href: AppRoute;
  icon: LucideIcon;
  keywords?: string[];
}

export const SEARCHABLE_PAGES: SearchablePage[] = [
  // Main nav
  {
    id: 'home',
    labelKey: 'sidebar.home',
    icon: Home,
    href: ROUTES.common.dashboard,
    keywords: ['dashboard'],
  },
  {
    id: 'projects',
    labelKey: 'sidebar.projects',
    icon: FolderKanban,
    href: ROUTES.dashboard.projects,
    keywords: ['all projects'],
  },
  {
    id: 'new-project',
    labelKey: 'sidebar.newProject',
    icon: Plus,
    href: ROUTES.dashboard.projectNew,
    keywords: ['create project', 'add project'],
  },

  // Settings
  {
    id: 'settings',
    labelKey: 'sidebar.settings',
    icon: Settings,
    href: ROUTES.settings.profile,
    keywords: ['settings', 'account', 'preferences'],
  },
  {
    id: 'settings-email',
    labelKey: 'settings.nav.email',
    icon: Mail,
    href: ROUTES.settings.email,
    keywords: ['email settings', 'change email'],
  },
  {
    id: 'settings-password',
    labelKey: 'settings.nav.password',
    icon: KeyRound,
    href: ROUTES.settings.password,
    keywords: ['password settings', 'change password', 'security'],
  },
  {
    id: 'settings-connected',
    labelKey: 'settings.nav.connectedAccounts',
    icon: Link2,
    href: ROUTES.settings.connectedAccounts,
    keywords: ['connected accounts', 'oauth', 'social'],
  },
  {
    id: 'settings-danger',
    labelKey: 'settings.nav.dangerZone',
    icon: Trash2,
    href: ROUTES.settings.dangerZone,
    keywords: ['danger zone', 'delete account'],
  },
];
