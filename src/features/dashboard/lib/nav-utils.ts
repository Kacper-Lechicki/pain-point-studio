import type {
  DynamicRouteTab,
  SubNavGroup,
  SubNavItem,
} from '@/features/dashboard/config/navigation';
import { DYNAMIC_ROUTE_TABS } from '@/features/dashboard/config/navigation';

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

// ── Dynamic route tab helpers ─────────────────────────────────────────

/**
 * Find the first matching dynamic route tab for the given pathname.
 * Returns `null` when no tab matches or when `parentHref` is not configured
 * in `DYNAMIC_ROUTE_TABS`.
 */
export function findDynamicTab(
  parentHref: string | undefined,
  pathname: string
): DynamicRouteTab | null {
  if (!parentHref) {
    return null;
  }

  const tabs = DYNAMIC_ROUTE_TABS[parentHref];

  if (!tabs) {
    return null;
  }

  return (
    tabs.find((tab) => {
      if (!pathname.startsWith(tab.prefix + '/')) {
        return false;
      }

      if (tab.excludeSegments) {
        const nextSegment = pathname.slice(tab.prefix.length + 1).split('/')[0];

        if (nextSegment && tab.excludeSegments.includes(nextSegment)) {
          return false;
        }
      }

      return true;
    }) ?? null
  );
}

/**
 * Resolve a human-readable label for a dynamic tab from breadcrumb segments.
 * Returns `null` when no label can be resolved (missing breadcrumb data or
 * segment ID).
 */
export function resolveDynamicLabel(
  dynamicTab: DynamicRouteTab | null,
  pathname: string,
  breadcrumbSegments: Record<string, string> | undefined | null
): string | null {
  if (!dynamicTab || !breadcrumbSegments) {
    return null;
  }

  const suffix = pathname.slice(dynamicTab.prefix.length + 1);
  const segmentId = suffix.split('/')[0];

  if (!segmentId) {
    return null;
  }

  return breadcrumbSegments[segmentId] ?? null;
}
