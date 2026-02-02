import { PATHNAMES } from '@/i18n/pathnames';

export type AppRoute = keyof typeof PATHNAMES;

export const ROUTES = {
  marketing: {
    home: '/' as AppRoute,
    solutions: '/solutions' as AppRoute,
    features: '/features' as AppRoute,
    pricing: '/pricing' as AppRoute,
    about: '/about' as AppRoute,
    howItWorks: '/how-it-works' as AppRoute,
    start: '/start' as AppRoute,
  },
  resources: {
    docs: '/docs' as AppRoute,
    blog: '/blog' as AppRoute,
    caseStudies: '/case-studies' as AppRoute,
    community: '/community' as AppRoute,
  },
  legal: {
    privacy: '/privacy' as AppRoute,
    terms: '/terms' as AppRoute,
  },
  auth: {
    signIn: '/sign-in' as AppRoute,
    signUp: '/sign-up' as AppRoute,
  },
  app: {
    dashboard: '/dashboard' as AppRoute,
    explore: '/explore' as AppRoute,
  },
} as const;
