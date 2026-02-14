'use client';

import { useMemo } from 'react';

import { useSearchParams } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

import { SIDEBAR_NAV_ITEM_CLASSES } from '../../config/nav-styles';
import type { SubNavConfig } from '../../config/navigation';
import { useHashSync } from '../../hooks/use-hash-sync';
import { getSubItemHref, isSubItemActive } from '../../lib/nav-utils';

interface SecondaryNavProps {
  titleKey: MessageKey;
  groups: SubNavConfig['groups'];
}

export function SecondaryNav({ titleKey, groups }: SecondaryNavProps) {
  const pathname = usePathname();
  const nextSearchParams = useSearchParams();
  const hash = useHashSync();
  const t = useTranslations();

  // Convert ReadonlyURLSearchParams to a stable string so we can use it as a
  // dependency and also create a fresh URLSearchParams from it.
  const searchString = nextSearchParams.toString();
  const currentSearchParams = useMemo(() => new URLSearchParams(searchString), [searchString]);

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
      <div className="shrink-0 pt-4">
        <div className="flex min-h-8 items-center px-3">
          <h2 className="text-sidebar-foreground decoration-sidebar-border text-sm font-semibold underline underline-offset-4">
            {t(titleKey)}
          </h2>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-2 pt-1.5 pb-3">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.headingKey && (
              <div
                className={cn(
                  'text-sidebar-foreground/50 mb-1 px-2 text-xs font-semibold tracking-wider uppercase',
                  gi === 0 ? 'mt-0' : 'mt-4'
                )}
              >
                {t(group.headingKey)}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              {group.items.map((item) => {
                const href = getSubItemHref(item);

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
                  ? isSubItemActive(item, pathname, hash, currentSearchParams, searchParamKeys)
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
