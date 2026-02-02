import { ComponentProps } from 'react';

import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

import { defaultLocale, locales } from '@/i18n/constants';
import { PATHNAMES } from '@/i18n/pathnames';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales,
  // Used when no locale matches
  defaultLocale,
  // Custom pathnames for localized routes
  pathnames: PATHNAMES,
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
const { Link: BaseLink, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

type BaseLinkProps = ComponentProps<typeof BaseLink>;
type Href = BaseLinkProps['href'];

// Custom Link component that supports both typed pathnames
// and raw strings (e.g. for hash links or external URLs)
export const Link = BaseLink as unknown as React.ForwardRefExoticComponent<
  Omit<BaseLinkProps, 'href'> & {
    href: Href | (string & {});
  } & React.RefAttributes<HTMLAnchorElement>
>;

export { redirect, usePathname, useRouter, getPathname };
