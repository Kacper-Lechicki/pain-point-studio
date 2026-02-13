'use client';

import { useEffect, useMemo, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

import { SIDEBAR_NAV_ITEM_CLASSES } from '../../config/nav-styles';
import type { SubNavConfig, SubNavItem } from '../../config/navigation';

function getHash(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.hash.replace('#', '');
}

function getItemHref(item: SubNavItem): string {
  const base = item.hash ? `${item.href}#${item.hash}` : item.href;

  if (item.searchParams) {
    const params = new URLSearchParams(item.searchParams);

    return `${item.href}?${params.toString()}${item.hash ? `#${item.hash}` : ''}`;
  }

  return base;
}

function isItemActive(
  item: SubNavItem,
  pathname: string,
  hash: string,
  currentSearchParams: URLSearchParams,
  searchParamKeys: string[]
): boolean {
  // Hash-based items
  if (item.hash) {
    return pathname === item.href && hash === item.hash;
  }

  // Items with searchParams: match pathname + all search params
  if (item.searchParams) {
    if (pathname !== item.href) {
      return false;
    }

    return Object.entries(item.searchParams).every(
      ([key, value]) => currentSearchParams.get(key) === value
    );
  }

  // Plain items: match pathname exactly, but NOT if current URL has any
  // of the search param keys used by sibling items
  if (pathname === item.href) {
    return searchParamKeys.every((key) => !currentSearchParams.has(key));
  }

  return item.alsoActiveFor?.includes(pathname) ?? false;
}

interface SecondaryNavProps {
  titleKey: MessageKey;
  groups: SubNavConfig['groups'];
}

export function SecondaryNav({ titleKey, groups }: SecondaryNavProps) {
  const pathname = usePathname();
  const nextSearchParams = useSearchParams();
  const [hash, setHash] = useState('');
  const t = useTranslations();

  // Convert ReadonlyURLSearchParams to a stable string so we can use it as a
  // dependency and also create a fresh URLSearchParams from it.
  const searchString = nextSearchParams.toString();
  const currentSearchParams = useMemo(() => new URLSearchParams(searchString), [searchString]);

  useEffect(() => {
    queueMicrotask(() => setHash(getHash()));

    const syncHash = () => setHash(getHash());

    window.addEventListener('hashchange', syncHash);
    window.addEventListener('popstate', syncHash);

    return () => {
      window.removeEventListener('hashchange', syncHash);
      window.removeEventListener('popstate', syncHash);
    };
  }, []);

  // Collect all search param keys used by any item (for disambiguating "All" vs specific filters)
  const hasSearchParamItems = groups.some((g) => g.items.some((i) => i.searchParams));
  const searchParamKeys = hasSearchParamItems
    ? [
        ...new Set(
          groups.flatMap((g) =>
            g.items.flatMap((i) => (i.searchParams ? Object.keys(i.searchParams) : []))
          )
        ),
      ]
    : [];

  return (
    <>
      <div className="shrink-0 pt-6">
        <div className="flex h-9 items-center px-4">
          <h2 className="text-sidebar-foreground decoration-sidebar-border text-sm font-semibold underline underline-offset-4">
            {t(titleKey)}
          </h2>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pt-2 pb-4">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.headingKey && (
              <div
                className={cn(
                  'text-sidebar-foreground/50 mb-1 px-2 text-xs font-semibold tracking-wider uppercase',
                  gi === 0 ? 'mt-0' : 'mt-6'
                )}
              >
                {t(group.headingKey)}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {group.items.map((item) => {
                const href = getItemHref(item);

                if (item.disabled) {
                  return (
                    <span
                      key={href}
                      data-state="inactive"
                      className={cn(SIDEBAR_NAV_ITEM_CLASSES, 'pointer-events-none opacity-50')}
                    >
                      <item.icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{t(item.labelKey)}</span>
                    </span>
                  );
                }

                const isActive = hasSearchParamItems
                  ? isItemActive(item, pathname, hash, currentSearchParams, searchParamKeys)
                  : item.hash
                    ? pathname === item.href && hash === item.hash
                    : pathname === item.href || (item.alsoActiveFor?.includes(pathname) ?? false);

                if (item.hash) {
                  return (
                    <a
                      key={href}
                      href={`#${item.hash}`}
                      data-state={isActive ? 'active' : 'inactive'}
                      className={SIDEBAR_NAV_ITEM_CLASSES}
                    >
                      <item.icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{t(item.labelKey)}</span>
                    </a>
                  );
                }

                return (
                  <Link
                    key={href}
                    href={href}
                    data-state={isActive ? 'active' : 'inactive'}
                    className={SIDEBAR_NAV_ITEM_CLASSES}
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}
