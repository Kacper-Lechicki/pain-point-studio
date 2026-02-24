import { PATHNAMES } from '@/i18n/pathnames';

export type AppRoute = keyof typeof PATHNAMES;

export const ROUTES = {
  auth: {
    signIn: '/sign-in' as AppRoute,
    signUp: '/sign-up' as AppRoute,
    signOut: '/sign-out' as AppRoute,
    forgotPassword: '/forgot-password' as AppRoute,
    updatePassword: '/update-password' as AppRoute,
    callback: '/auth/callback',
  },
  common: {
    home: '/' as AppRoute,
    dashboard: '/dashboard' as AppRoute,
    settings: '/settings' as AppRoute,
  },
  settings: {
    profile: '/settings/profile' as AppRoute,
    email: '/settings/email' as AppRoute,
    password: '/settings/password' as AppRoute,
    connectedAccounts: '/settings/connected-accounts' as AppRoute,
    dangerZone: '/settings/danger-zone' as AppRoute,
  },
  dashboard: {
    research: '/dashboard/research' as AppRoute,
    researchNew: '/dashboard/research/new' as AppRoute,
    researchArchive: '/dashboard/research/archive' as AppRoute,
    researchStats: '/dashboard/research/stats',
    projects: '/dashboard/projects' as AppRoute,
    projectDetail: '/dashboard/projects' as AppRoute,
    projectNew: '/dashboard/projects/new' as AppRoute,
  },
  profile: {
    preview: '/profile/preview' as AppRoute,
  },
  survey: {
    respond: '/r',
  },
} as const;

/**
 * Sibling route groups — navigating between routes in the same group
 * automatically uses `replace` instead of `push` to prevent history buildup.
 *
 * Add any set of routes that users commonly ping-pong between.
 */
export const SIBLING_GROUPS: readonly (readonly AppRoute[])[] = [
  [ROUTES.auth.signIn, ROUTES.auth.signUp, ROUTES.auth.forgotPassword],
  [ROUTES.dashboard.research, ROUTES.dashboard.researchArchive, ROUTES.dashboard.researchNew],
  [ROUTES.dashboard.projects, ROUTES.dashboard.projectNew],
];

export const SETTINGS_SECTION_VALUES = [
  'profile',
  'email',
  'password',
  'connectedAccounts',
  'dangerZone',
] as const;

export type SettingsSectionValue = (typeof SETTINGS_SECTION_VALUES)[number];

export const SECTION_TO_HASH: Record<SettingsSectionValue, string> = {
  profile: 'profile',
  email: 'email',
  password: 'password',
  connectedAccounts: 'connected-accounts',
  dangerZone: 'danger-zone',
};
