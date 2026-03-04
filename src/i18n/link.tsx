'use client';

import { type ComponentProps, type Ref } from 'react';

import { type AppRoute, SIBLING_GROUPS } from '@/config/routes';
import { BaseLink, usePathname } from '@/i18n/navigation';

type BaseLinkProps = ComponentProps<typeof BaseLink>;
type Href = BaseLinkProps['href'];

interface LinkProps extends Omit<BaseLinkProps, 'href'> {
  href: Href | (string & {});
}

function pathnameOnly(path: string): string {
  return path.split('?')[0]!.split('#')[0]!;
}

function resolveHrefPathname(href: LinkProps['href']): string {
  if (typeof href === 'string') {
    return pathnameOnly(href);
  }

  if (typeof href === 'object' && 'pathname' in href) {
    return pathnameOnly(String(href.pathname));
  }

  return '';
}

function areSiblings(current: string, target: string): boolean {
  return SIBLING_GROUPS.some(
    (group) => group.includes(current as AppRoute) && group.includes(target as AppRoute)
  );
}

function Link({ replace, ref, ...props }: LinkProps & { ref?: Ref<HTMLAnchorElement> }) {
  const pathname = usePathname();
  const target = resolveHrefPathname(props.href);
  const current = pathnameOnly(pathname ?? '');
  const autoReplace = replace ?? areSiblings(current, target);

  return <BaseLink ref={ref} replace={autoReplace} {...(props as BaseLinkProps)} />;
}

export default Link;
