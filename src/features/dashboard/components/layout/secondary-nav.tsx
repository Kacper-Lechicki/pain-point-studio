'use client';

import { useMemo } from 'react';

import { useSearchParams } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { useBreadcrumbContext } from '@/features/dashboard/components/layout/breadcrumb-context';
import { SIDEBAR_NAV_ITEM_CLASSES } from '@/features/dashboard/config/nav-styles';
import type { SubNavConfig } from '@/features/dashboard/config/navigation';
import { DYNAMIC_ROUTE_TABS } from '@/features/dashboard/config/navigation';
import { useHashSync } from '@/features/dashboard/hooks/use-hash-sync';
import {
  collectSearchParamKeys,
  getSubItemHref,
  isSubItemActive,
} from '@/features/dashboard/lib/nav-utils';
import { Link, usePathname } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface SecondaryNavProps {
  titleKey: MessageKey;
  groups: SubNavConfig['groups'];
  parentHref?: string | undefined;
}

export function SecondaryNav({ titleKey, groups, parentHref }: SecondaryNavProps) {
  const pathname = usePathname();
  const nextSearchParams = useSearchParams();
  const hash = useHashSync();
  const t = useTranslations();
  const breadcrumb = useBreadcrumbContext();

  const searchString = nextSearchParams.toString();
  const currentSearchParams = useMemo(() => new URLSearchParams(searchString), [searchString]);

  const searchParamKeys = collectSearchParamKeys(groups);

  const dynamicTab = useMemo(() => {
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
  }, [parentHref, pathname]);

  const dynamicLabel = useMemo(() => {
    if (!dynamicTab || !breadcrumb) {
      return null;
    }

    const suffix = pathname.slice(dynamicTab.prefix.length + 1);
    const segmentId = suffix.split('/')[0];

    if (!segmentId) {
      return null;
    }

    return breadcrumb.segments[segmentId] ?? null;
  }, [dynamicTab, breadcrumb, pathname]);

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

                const isDynamicActive = dynamicTab != null;

                const isActive = isDynamicActive
                  ? false
                  : isSubItemActive(item, pathname, hash, currentSearchParams, searchParamKeys);

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

        {dynamicTab && dynamicLabel && (
          <div>
            <div className="text-sidebar-foreground/50 mt-4 mb-1 px-2 text-xs font-semibold tracking-wider uppercase">
              {t('sidebar.dynamicHeading' as Parameters<typeof t>[0])}
            </div>
            <div className="flex flex-col gap-1.5">
              <Link href={pathname} data-state="active" className={SIDEBAR_NAV_ITEM_CLASSES}>
                <dynamicTab.icon className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{dynamicLabel}</span>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
