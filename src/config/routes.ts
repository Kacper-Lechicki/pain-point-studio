import { PATHNAMES } from '@/i18n/pathnames';

export type AppRoute = keyof typeof PATHNAMES;

export const ROUTES = {
  auth: {
    signIn: '/sign-in' as AppRoute,
    signUp: '/sign-up' as AppRoute,
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
    /** Base path for dynamic stats routes — not an AppRoute. Use `getSurveyStatsUrl(id)`. */
    researchStats: '/dashboard/research/stats',
    /** Base path for builder routes — not an AppRoute. Use `getSurveyEditUrl(id)`. */
    researchNew: '/dashboard/research/new',
    projects: '/dashboard/projects' as AppRoute,
    projectNew: '/dashboard/projects/new' as AppRoute,
  },
  profile: {
    preview: '/profile/preview' as AppRoute,
  },
  survey: {
    /** Base path for public respondent routes — not an AppRoute. Used as `/r/[slug]`. */
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
  [ROUTES.dashboard.projects, ROUTES.dashboard.projectNew],
];

/** Ordered list of settings page section identifiers (used for tabs / scroll anchors). */
export const SETTINGS_SECTION_VALUES = [
  'profile',
  'email',
  'password',
  'connectedAccounts',
  'dangerZone',
] as const;

export type SettingsSectionValue = (typeof SETTINGS_SECTION_VALUES)[number];

/** Maps section identifiers to URL-friendly hash fragments (camelCase → kebab-case). */
export const SECTION_TO_HASH: Record<SettingsSectionValue, string> = {
  profile: 'profile',
  email: 'email',
  password: 'password',
  connectedAccounts: 'connected-accounts',
  dangerZone: 'danger-zone',
};
