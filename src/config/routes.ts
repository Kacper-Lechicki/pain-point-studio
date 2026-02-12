import { PATHNAMES } from '@/i18n/pathnames';

/** Union of all pathnames from i18n pathnames config. */
export type AppRoute = keyof typeof PATHNAMES;

/** Central route definitions; use with Link/useRouter from @/i18n/routing. */
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
    appearance: '/settings/appearance' as AppRoute,
    connectedAccounts: '/settings/connected-accounts' as AppRoute,
    dangerZone: '/settings/danger-zone' as AppRoute,
  },
  dashboard: {
    surveys: '/dashboard/surveys' as AppRoute,
    surveysNew: '/dashboard/surveys/new' as AppRoute,
    surveysBuilder: '/dashboard/surveys/new/[id]',
    analytics: '/dashboard/analytics' as AppRoute,
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
];

/** All settings page section identifiers (URL hash source). */
export const SETTINGS_SECTION_VALUES = [
  'profile',
  'email',
  'password',
  'appearance',
  'connectedAccounts',
  'dangerZone',
] as const;

export type SettingsSectionValue = (typeof SETTINGS_SECTION_VALUES)[number];

/** Maps settings section id to URL hash (e.g. connectedAccounts → connected-accounts). */
export const SECTION_TO_HASH: Record<SettingsSectionValue, string> = {
  profile: 'profile',
  email: 'email',
  password: 'password',
  appearance: 'appearance',
  connectedAccounts: 'connected-accounts',
  dangerZone: 'danger-zone',
};

/** Inverse of SECTION_TO_HASH: URL hash → settings section id. */
export const HASH_TO_SECTION: Record<string, SettingsSectionValue> = Object.fromEntries(
  Object.entries(SECTION_TO_HASH).map(([k, v]) => [v, k as SettingsSectionValue])
) as Record<string, SettingsSectionValue>;
