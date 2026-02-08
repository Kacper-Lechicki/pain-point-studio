import { PATHNAMES } from '@/i18n/pathnames';

// Type-safe route keys based on defined pathnames
export type AppRoute = keyof typeof PATHNAMES;

// Centralized route configuration for type-safe navigation
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
  profile: {
    preview: '/profile/preview' as AppRoute,
  },
} as const;
