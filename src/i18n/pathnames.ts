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
  '/settings/connected-accounts': {
    en: '/settings/connected-accounts',
  },
  '/settings/danger-zone': {
    en: '/settings/danger-zone',
  },
  '/dashboard/projects': {
    en: '/dashboard/projects',
  },
  '/dashboard/projects/new': {
    en: '/dashboard/projects/new',
  },
  '/sign-in': {
    en: '/sign-in',
  },
  '/sign-up': {
    en: '/sign-up',
  },
  '/forgot-password': {
    en: '/forgot-password',
  },
  '/update-password': {
    en: '/update-password',
  },
} as const;
