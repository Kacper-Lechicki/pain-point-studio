'use client';

import { ComponentProps, forwardRef } from 'react';

import { type AppRoute, SIBLING_GROUPS } from '@/config/routes';
import { BaseLink, usePathname } from '@/i18n/navigation';

type BaseLinkProps = ComponentProps<typeof BaseLink>;
type Href = BaseLinkProps['href'];

type LinkProps = Omit<BaseLinkProps, 'href'> & {
  href: Href | (string & {});
};

function resolveHrefPathname(href: LinkProps['href']): string {
  if (typeof href === 'string') {return href;}

  if (typeof href === 'object' && 'pathname' in href) {return href.pathname as string;}

  return '';
}

function areSiblings(current: string, target: string): boolean {
  return SIBLING_GROUPS.some(
    (group) => group.includes(current as AppRoute) && group.includes(target as AppRoute)
  );
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(({ replace, ...props }, ref) => {
  const pathname = usePathname();
  const target = resolveHrefPathname(props.href);
  const autoReplace = replace ?? areSiblings(pathname, target);

  return <BaseLink ref={ref} replace={autoReplace} {...(props as BaseLinkProps)} />;
});

Link.displayName = 'Link';

export default Link;
