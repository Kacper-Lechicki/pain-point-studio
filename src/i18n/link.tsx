/**
 * i18n-aware Link that wraps next-intl's BaseLink. When navigating between routes
 * in the same SIBLING_GROUPS (e.g. sign-in ↔ sign-up), uses replace instead of
 * push to avoid history buildup. Import via @/i18n/routing.
 */
'use client';

import { ComponentProps, forwardRef } from 'react';

import { type AppRoute, SIBLING_GROUPS } from '@/config/routes';
import { BaseLink, usePathname } from '@/i18n/navigation';

/**
 * i18n-aware Link that wraps next-intl's BaseLink. When navigating between routes
 * in the same SIBLING_GROUPS (e.g. sign-in ↔ sign-up), uses replace instead of
 * push to avoid history buildup. Import via @/i18n/routing.
 */

/**
 * i18n-aware Link that wraps next-intl's BaseLink. When navigating between routes
 * in the same SIBLING_GROUPS (e.g. sign-in ↔ sign-up), uses replace instead of
 * push to avoid history buildup. Import via @/i18n/routing.
 */

/**
 * i18n-aware Link that wraps next-intl's BaseLink. When navigating between routes
 * in the same SIBLING_GROUPS (e.g. sign-in ↔ sign-up), uses replace instead of
 * push to avoid history buildup. Import via @/i18n/routing.
 */

/**
 * i18n-aware Link that wraps next-intl's BaseLink. When navigating between routes
 * in the same SIBLING_GROUPS (e.g. sign-in ↔ sign-up), uses replace instead of
 * push to avoid history buildup. Import via @/i18n/routing.
 */

/**
 * i18n-aware Link that wraps next-intl's BaseLink. When navigating between routes
 * in the same SIBLING_GROUPS (e.g. sign-in ↔ sign-up), uses replace instead of
 * push to avoid history buildup. Import via @/i18n/routing.
 */

/**
 * i18n-aware Link that wraps next-intl's BaseLink. When navigating between routes
 * in the same SIBLING_GROUPS (e.g. sign-in ↔ sign-up), uses replace instead of
 * push to avoid history buildup. Import via @/i18n/routing.
 */

/**
 * i18n-aware Link that wraps next-intl's BaseLink. When navigating between routes
 * in the same SIBLING_GROUPS (e.g. sign-in ↔ sign-up), uses replace instead of
 * push to avoid history buildup. Import via @/i18n/routing.
 */

/**
 * i18n-aware Link that wraps next-intl's BaseLink. When navigating between routes
 * in the same SIBLING_GROUPS (e.g. sign-in ↔ sign-up), uses replace instead of
 * push to avoid history buildup. Import via @/i18n/routing.
 */

/**
 * i18n-aware Link that wraps next-intl's BaseLink. When navigating between routes
 * in the same SIBLING_GROUPS (e.g. sign-in ↔ sign-up), uses replace instead of
 * push to avoid history buildup. Import via @/i18n/routing.
 */

/**
 * i18n-aware Link that wraps next-intl's BaseLink. When navigating between routes
 * in the same SIBLING_GROUPS (e.g. sign-in ↔ sign-up), uses replace instead of
 * push to avoid history buildup. Import via @/i18n/routing.
 */

/**
 * i18n-aware Link that wraps next-intl's BaseLink. When navigating between routes
 * in the same SIBLING_GROUPS (e.g. sign-in ↔ sign-up), uses replace instead of
 * push to avoid history buildup. Import via @/i18n/routing.
 */

/**
 * i18n-aware Link that wraps next-intl's BaseLink. When navigating between routes
 * in the same SIBLING_GROUPS (e.g. sign-in ↔ sign-up), uses replace instead of
 * push to avoid history buildup. Import via @/i18n/routing.
 */

/**
 * i18n-aware Link that wraps next-intl's BaseLink. When navigating between routes
 * in the same SIBLING_GROUPS (e.g. sign-in ↔ sign-up), uses replace instead of
 * push to avoid history buildup. Import via @/i18n/routing.
 */

/**
 * i18n-aware Link that wraps next-intl's BaseLink. When navigating between routes
 * in the same SIBLING_GROUPS (e.g. sign-in ↔ sign-up), uses replace instead of
 * push to avoid history buildup. Import via @/i18n/routing.
 */

/**
 * i18n-aware Link that wraps next-intl's BaseLink. When navigating between routes
 * in the same SIBLING_GROUPS (e.g. sign-in ↔ sign-up), uses replace instead of
 * push to avoid history buildup. Import via @/i18n/routing.
 */

/**
 * i18n-aware Link that wraps next-intl's BaseLink. When navigating between routes
 * in the same SIBLING_GROUPS (e.g. sign-in ↔ sign-up), uses replace instead of
 * push to avoid history buildup. Import via @/i18n/routing.
 */

/**
 * i18n-aware Link that wraps next-intl's BaseLink. When navigating between routes
 * in the same SIBLING_GROUPS (e.g. sign-in ↔ sign-up), uses replace instead of
 * push to avoid history buildup. Import via @/i18n/routing.
 */

/**
 * i18n-aware Link that wraps next-intl's BaseLink. When navigating between routes
 * in the same SIBLING_GROUPS (e.g. sign-in ↔ sign-up), uses replace instead of
 * push to avoid history buildup. Import via @/i18n/routing.
 */

type BaseLinkProps = ComponentProps<typeof BaseLink>;
type Href = BaseLinkProps['href'];

interface LinkProps extends Omit<BaseLinkProps, 'href'> {
  href: Href | (string & {});
}

/** Strips query and hash so pathnames can be compared for sibling detection. */
function pathnameOnly(path: string): string {
  const withoutQuery = path.split('?')[0] ?? path;

  return withoutQuery.split('#')[0] ?? withoutQuery;
}

/** Resolves href (string or pathname object) to a pathname-only string. */
function resolveHrefPathname(href: LinkProps['href']): string {
  if (typeof href === 'string') {
    return pathnameOnly(href);
  }

  if (typeof href === 'object' && 'pathname' in href) {
    return pathnameOnly(String(href.pathname));
  }

  return '';
}

/** True if both paths belong to the same SIBLING_GROUPS entry (e.g. sign-in and sign-up). */
function areSiblings(current: string, target: string): boolean {
  return SIBLING_GROUPS.some(
    (group) => group.includes(current as AppRoute) && group.includes(target as AppRoute)
  );
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(({ replace, ...props }, ref) => {
  const pathname = usePathname();
  const target = resolveHrefPathname(props.href);
  const current = pathnameOnly(pathname ?? '');
  const autoReplace = replace ?? areSiblings(current, target);

  return <BaseLink ref={ref} replace={autoReplace} {...(props as BaseLinkProps)} />;
});

Link.displayName = 'Link';

export default Link;
