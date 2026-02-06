import { ComponentProps } from 'react';

import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

import { defaultLocale, locales } from '@/i18n/constants';
import { PATHNAMES } from '@/i18n/pathnames';

export const routing = defineRouting({
  locales,
  defaultLocale,
  pathnames: PATHNAMES,
});

// Create navigation utilities based on the routing configuration
const { Link: BaseLink, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

type BaseLinkProps = ComponentProps<typeof BaseLink>;
type Href = BaseLinkProps['href'];

// Export a strongly-typed Link component that also accepts string hrefs
export const Link = BaseLink as unknown as React.ForwardRefExoticComponent<
  Omit<BaseLinkProps, 'href'> & {
    href: Href | (string & {});
  } & React.RefAttributes<HTMLAnchorElement>
>;

export { redirect, usePathname, useRouter, getPathname };
