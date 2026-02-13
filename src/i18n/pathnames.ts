/**
 * next-intl pathname map: abstract path → per-locale path. Used by middleware
 * and navigation for locale-prefixed URLs. Keys here define AppRoute in @/config/routes.
 */
export const PATHNAMES = {
  '/': {
    en: '/',
  },
  '/dashboard': {
    en: '/dashboard',
  },
  '/settings': {
    en: '/settings',
  },
  '/settings/profile': {
    en: '/settings/profile',
  },
  '/settings/email': {
    en: '/settings/email',
  },
  '/settings/password': {
    en: '/settings/password',
  },
  '/settings/appearance': {
    en: '/settings/appearance',
  },
  '/settings/connected-accounts': {
    en: '/settings/connected-accounts',
  },
  '/settings/danger-zone': {
    en: '/settings/danger-zone',
  },
  '/profile/preview': {
    en: '/profile/preview',
  },
  '/dashboard/surveys': {
    en: '/dashboard/surveys',
  },
  '/dashboard/surveys/new': {
    en: '/dashboard/surveys/new',
  },
  '/dashboard/surveys/archive': {
    en: '/dashboard/surveys/archive',
  },
  '/dashboard/analytics': {
    en: '/dashboard/analytics',
  },
  '/sign-in': {
    en: '/sign-in',
  },
  '/sign-up': {
    en: '/sign-up',
  },
  '/sign-out': {
    en: '/sign-out',
  },
  '/forgot-password': {
    en: '/forgot-password',
  },
  '/update-password': {
    en: '/update-password',
  },
} as const;
