/**
 * next-intl routing and navigation: defines locales/pathnames and creates
 * BaseLink, redirect, usePathname, useRouter, getPathname. For app code,
 * prefer @/i18n/routing (re-exports Link with sibling replace behaviour).
 */
import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

import { defaultLocale, locales } from '@/i18n/constants';
import { PATHNAMES } from '@/i18n/pathnames';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'never',
  pathnames: PATHNAMES,
});

export const {
  Link: BaseLink,

  usePathname,
  useRouter,
} = createNavigation(routing);
