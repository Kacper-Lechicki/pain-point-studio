import { PATHNAMES } from '@/i18n/pathnames';

export type AppRoute = keyof typeof PATHNAMES;

export const ROUTES = {
  auth: {
    signIn: '/sign-in' as AppRoute,
    signUp: '/sign-up' as AppRoute,
    signOut: '/sign-out' as AppRoute,
    forgotPassword: '/forgot-password' as AppRoute,
    updatePassword: '/update-password' as AppRoute,
  },
  common: {
    home: '/' as AppRoute,
    dashboard: '/dashboard' as AppRoute,
    settings: '/settings' as AppRoute,
  },
  test: {
    instruments: '/instruments' as AppRoute,
  },
} as const;
