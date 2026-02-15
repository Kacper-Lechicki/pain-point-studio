import type { SubNavGroup, SubNavItem } from '@/features/dashboard/config/navigation';

/** Build the full href for a sub-nav item (path + search params + hash). */
export function getSubItemHref(item: SubNavItem): string {
  if (item.searchParams) {
    const params = new URLSearchParams(item.searchParams);

    return `${item.href}?${params.toString()}${item.hash ? `#${item.hash}` : ''}`;
  }

  return item.hash ? `${item.href}#${item.hash}` : item.href;
}

/**
 * Collect all unique search-param keys used by items in the given groups.
 * Returns an empty array when no item defines searchParams (fast path).
 */
export function collectSearchParamKeys(groups: SubNavGroup[]): string[] {
  const hasAny = groups.some((g) => g.items.some((i) => i.searchParams));

  if (!hasAny) {
    return [];
  }

  return [
    ...new Set(
      groups.flatMap((g) =>
        g.items.flatMap((i) => (i.searchParams ? Object.keys(i.searchParams) : []))
      )
    ),
  ];
}

/** Check whether a sub-nav item matches the current URL (pathname + hash + search params). */
export function isSubItemActive(
  item: SubNavItem,
  pathname: string,
  hash: string,
  currentSearchParams: URLSearchParams,
  searchParamKeys: string[]
): boolean {
  if (item.hash) {
    return pathname === item.href && hash === item.hash;
  }

  if (item.searchParams) {
    if (pathname !== item.href) {
      return false;
    }

    return Object.entries(item.searchParams).every(
      ([key, value]) => currentSearchParams.get(key) === value
    );
  }

  if (pathname === item.href) {
    return searchParamKeys.every((key) => !currentSearchParams.has(key));
  }

  return item.alsoActiveFor?.includes(pathname) ?? false;
}
