'use client';

import { useMemo } from 'react';

import { useSearchParams } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { useBreadcrumbContext } from '@/features/dashboard/components/layout/breadcrumb-context';
import { useSubPanelItems } from '@/features/dashboard/components/layout/sub-panel-items-context';
import { SIDEBAR_NAV_ITEM_CLASSES } from '@/features/dashboard/config/nav-styles';
import type { SubNavConfig } from '@/features/dashboard/config/navigation';
import { useHashSync } from '@/features/dashboard/hooks/use-hash-sync';
import {
  collectSearchParamKeys,
  findDynamicTab,
  getSubItemHref,
  isSubItemActive,
  resolveDynamicLabel,
} from '@/features/dashboard/lib/nav-utils';
import { Link, usePathname } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

function SecondaryNavSkeleton() {
  return (
    <>
      {/* Back link skeleton */}
      <div className="flex flex-col gap-1.5 px-2 pt-4">
        <div className="flex min-h-8 items-center gap-2 px-2.5">
          <div className="bg-sidebar-foreground/10 size-4 shrink-0 animate-pulse rounded" />
          <div className="bg-sidebar-foreground/10 h-3.5 w-24 animate-pulse rounded" />
        </div>
      </div>

      {/* Title skeleton */}
      <div className="shrink-0 pt-2">
        <div className="flex min-h-8 items-center px-3">
          <div className="bg-sidebar-foreground/10 h-3.5 w-28 animate-pulse rounded" />
        </div>
      </div>

      {/* Nav item skeleton */}
      <div className="flex flex-col gap-1.5 px-2 pt-1.5">
        <div className="flex min-h-8 items-center gap-2 px-2.5">
          <div className="bg-sidebar-foreground/10 size-4 shrink-0 animate-pulse rounded" />
          <div className="bg-sidebar-foreground/10 h-3.5 w-32 animate-pulse rounded" />
        </div>
      </div>
    </>
  );
}

// ── Shared sub-panel link renderer ─────────────────────────────────────

function SubPanelLinkItem({
  link,
  isActive,
}: {
  link: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    disabled?: boolean;
  };
  isActive?: boolean;
}) {
  if (link.disabled) {
    return (
      <span
        data-state="inactive"
        className={cn(SIDEBAR_NAV_ITEM_CLASSES, 'pointer-events-none opacity-50')}
      >
        <link.icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{link.label}</span>
      </span>
    );
  }

  return (
    <Link
      href={link.href}
      data-state={isActive ? 'active' : 'inactive'}
      className={SIDEBAR_NAV_ITEM_CLASSES}
    >
      <link.icon className="size-4 shrink-0" aria-hidden />
      <span className="truncate">{link.label}</span>
    </Link>
  );
}

// ── Main component ─────────────────────────────────────────────────────

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
  const subPanelItems = useSubPanelItems();
  const searchString = nextSearchParams.toString();
  const currentSearchParams = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const searchParamKeys = collectSearchParamKeys(groups);
  const dynamicTab = useMemo(() => findDynamicTab(parentHref, pathname), [parentHref, pathname]);

  const dynamicLabel = useMemo(
    () => resolveDynamicLabel(dynamicTab, pathname, breadcrumb?.segments),
    [dynamicTab, breadcrumb, pathname]
  );

  // Dynamic route detected but data not yet ready — show skeleton to prevent
  // stale content from flashing while breadcrumbs / sub-panel links register.
  const isDynamicPending =
    dynamicTab != null &&
    (dynamicLabel == null || !subPanelItems || subPanelItems.links.length === 0);

  if (isDynamicPending) {
    return <SecondaryNavSkeleton />;
  }

  const isDynamicActive = dynamicTab != null && dynamicLabel != null;

  // When a bottom link's href matches the current pathname, that link is active
  // and the dynamic tab item becomes a regular (inactive) link.
  const hasActiveBottomLink =
    isDynamicActive &&
    (subPanelItems?.bottomLinks.some((l) => !l.disabled && pathname === l.href) ?? false);

  // Resolve title: dynamic tab titleKey > parent titleKey
  const resolvedTitleKey = isDynamicActive && dynamicTab.titleKey ? dynamicTab.titleKey : titleKey;

  // ── Dynamic panel rendering ─────────────────────────────────────────

  if (isDynamicActive) {
    return (
      <>
        {subPanelItems && subPanelItems.links.length > 0 && (
          <div className="flex flex-col gap-1.5 px-2 pt-4">
            {subPanelItems.links.map((link) => (
              <SubPanelLinkItem key={link.href} link={link} />
            ))}
          </div>
        )}

        <div className={cn('shrink-0', subPanelItems?.links.length ? 'pt-2' : 'pt-4')}>
          <div className="flex min-h-8 items-center px-3">
            <h2 className="text-sidebar-foreground decoration-sidebar-foreground/35 text-sm font-semibold underline underline-offset-4">
              {t(resolvedTitleKey)}
            </h2>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-2 pt-1.5 pb-3">
          <div className="flex flex-col gap-1.5">
            {/* Dynamic tab item (e.g. project name) */}
            <Link
              href={
                hasActiveBottomLink
                  ? `${dynamicTab.prefix}/${pathname.slice(dynamicTab.prefix.length + 1).split('/')[0]}`
                  : pathname
              }
              data-state={hasActiveBottomLink ? 'inactive' : 'active'}
              className={SIDEBAR_NAV_ITEM_CLASSES}
            >
              <dynamicTab.icon className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{dynamicLabel}</span>
            </Link>

            {/* Bottom links — active when pathname matches */}
            {subPanelItems &&
              subPanelItems.bottomLinks.length > 0 &&
              subPanelItems.bottomLinks.map((link) => (
                <SubPanelLinkItem
                  key={link.href + link.label}
                  link={link}
                  isActive={!link.disabled && pathname === link.href}
                />
              ))}
          </div>
        </nav>
      </>
    );
  }

  // ── Static groups rendering ───────────────────────────────────────

  return (
    <>
      <div className="shrink-0 pt-4">
        <div className="flex min-h-8 items-center px-3">
          <h2 className="text-sidebar-foreground decoration-sidebar-foreground/35 text-sm font-semibold underline underline-offset-4">
            {t(resolvedTitleKey)}
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

                const isActive = isSubItemActive(
                  item,
                  pathname,
                  hash,
                  currentSearchParams,
                  searchParamKeys
                );

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
