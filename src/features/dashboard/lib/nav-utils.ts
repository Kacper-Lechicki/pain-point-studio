import type { SubNavItem } from '../config/navigation';

export function getSubItemHref(item: SubNavItem): string {
  if (item.searchParams) {
    const params = new URLSearchParams(item.searchParams);

    return `${item.href}?${params.toString()}${item.hash ? `#${item.hash}` : ''}`;
  }

  return item.hash ? `${item.href}#${item.hash}` : item.href;
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
