'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import {
  SIDEBAR_NAV_ACTIVE,
  SIDEBAR_NAV_INACTIVE,
  SIDEBAR_NAV_ITEM_BASE,
  SIDEBAR_NAV_ITEM_CLASSES,
} from '@/features/dashboard/config/nav-styles';
import type { SubNavGroup } from '@/features/dashboard/config/navigation';
import {
  DYNAMIC_SIDEBAR_ITEMS,
  type NavItem,
  SIDEBAR_BOTTOM_ITEM,
  SIDEBAR_GIVE_FEEDBACK_ITEM,
  SIDEBAR_NAV,
  SIDEBAR_PROFILE_ITEM,
} from '@/features/dashboard/config/navigation';
import {
  collectSearchParamKeys,
  findDynamicTab,
  getSubItemHref,
  isSubItemActive,
  matchesNavItem,
  resolveDynamicLabel,
} from '@/features/dashboard/lib/nav-utils';
import type { SubPanelLink } from '@/hooks/common/use-sub-panel-items';
import { Link } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface SubNavItemsProps {
  groups: SubNavGroup[];
  pathname: string;
  clientState: { search: string; hash: string } | null;
  t: (key: MessageKey) => string;
  onNavigate: () => void;
  parentHref?: string | undefined;
  breadcrumbSegments?: Record<string, string> | undefined;
}

function SubNavItems({
  groups,
  pathname,
  clientState,
  t,
  onNavigate,
  parentHref,
  breadcrumbSegments,
}: SubNavItemsProps) {
  const searchParamKeys = collectSearchParamKeys(groups);
  const currentSearchParams = clientState ? new URLSearchParams(clientState.search) : null;
  const hash = clientState?.hash ?? '';
  const dynamicTab = findDynamicTab(parentHref, pathname);
  const dynamicLabel = resolveDynamicLabel(dynamicTab, pathname, breadcrumbSegments);
  const isDynamicActive = dynamicTab != null && dynamicLabel != null;

  return (
    <nav className="flex flex-1 flex-col gap-2 p-2 pb-8" onClick={onNavigate}>
      {isDynamicActive ? (
        <div className="flex flex-col gap-2">
          <Link href={pathname} className={cn(SIDEBAR_NAV_ITEM_BASE, SIDEBAR_NAV_ACTIVE)}>
            <dynamicTab.icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{dynamicLabel}</span>
          </Link>
        </div>
      ) : (
        groups.map((group, gi) => (
          <div key={gi}>
            {group.headingKey && (
              <div
                className={cn(
                  'text-muted-foreground mb-1 px-3 text-xs font-semibold tracking-wider uppercase',
                  gi === 0 ? 'mt-0' : 'mt-6'
                )}
              >
                {t(group.headingKey)}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {group.items.map((subItem) => {
                const href = getSubItemHref(subItem);

                if (subItem.disabled) {
                  return (
                    <span
                      key={href}
                      data-state="inactive"
                      className={cn(
                        SIDEBAR_NAV_ITEM_BASE,
                        SIDEBAR_NAV_INACTIVE,
                        'pointer-events-none opacity-50'
                      )}
                    >
                      <subItem.icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{t(subItem.labelKey)}</span>
                    </span>
                  );
                }

                const isActive =
                  clientState && currentSearchParams
                    ? isSubItemActive(subItem, pathname, hash, currentSearchParams, searchParamKeys)
                    : false;

                const stateClasses = isActive ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_INACTIVE;

                if (subItem.hash) {
                  return (
                    <a
                      key={href}
                      href={`#${subItem.hash}`}
                      className={cn(SIDEBAR_NAV_ITEM_BASE, stateClasses)}
                    >
                      <subItem.icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{t(subItem.labelKey)}</span>
                    </a>
                  );
                }

                return (
                  <Link key={href} href={href} className={cn(SIDEBAR_NAV_ITEM_BASE, stateClasses)}>
                    <subItem.icon className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{t(subItem.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))
      )}
    </nav>
  );
}

function MobileNavItem({
  item,
  isActive,
  t,
  onSubNavClick,
  onLinkClick,
}: {
  item: NavItem;
  isActive: boolean;
  t: (key: MessageKey) => string;
  onSubNavClick?: () => void;
  onLinkClick?: () => void;
}) {
  if (item.disabled) {
    return (
      <span
        data-state="inactive"
        className={cn(SIDEBAR_NAV_ITEM_CLASSES, 'pointer-events-none opacity-50')}
      >
        <item.icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{t(item.labelKey)}</span>
      </span>
    );
  }

  if (item.subNav) {
    return (
      <button
        type="button"
        data-state={isActive ? 'active' : 'inactive'}
        onClick={onSubNavClick}
        className={SIDEBAR_NAV_ITEM_CLASSES}
      >
        <item.icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{t(item.labelKey)}</span>
        <ChevronRight className="ml-auto size-4 opacity-50" />
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      data-state={isActive ? 'active' : 'inactive'}
      onClick={onLinkClick}
      className={SIDEBAR_NAV_ITEM_CLASSES}
    >
      <item.icon className="size-4 shrink-0" aria-hidden />
      <span className="truncate">{t(item.labelKey)}</span>
    </Link>
  );
}

interface MobileNavMainLevelProps {
  pathname: string;
  t: (key: MessageKey) => string;
  onItemClick: (item: NavItem) => void;
  onClose: () => void;
}

export function MobileNavMainLevel({ pathname, t, onItemClick, onClose }: MobileNavMainLevelProps) {
  return (
    <>
      <nav className="flex flex-1 flex-col gap-2 px-2 pt-4">
        {SIDEBAR_NAV.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-2">
            {group.items.map((item) => {
              const isActive = item.subNav
                ? matchesNavItem(pathname, item)
                : pathname === (item.activePrefix ?? item.href);

              return (
                <MobileNavItem
                  key={item.labelKey}
                  item={item}
                  isActive={isActive}
                  t={t}
                  onSubNavClick={() => onItemClick(item)}
                  onLinkClick={() => onItemClick(item)}
                />
              );
            })}
          </div>
        ))}

        {DYNAMIC_SIDEBAR_ITEMS.some((di) => pathname === di.path) && (
          <div className="mt-2 flex flex-col gap-2">
            {DYNAMIC_SIDEBAR_ITEMS.filter((di) => pathname === di.path).map((di) => (
              <Link
                key={di.path}
                href={di.path}
                data-state="active"
                onClick={() => onClose()}
                className={SIDEBAR_NAV_ITEM_CLASSES}
              >
                <di.icon className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{t(di.labelKey)}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-2 px-2 pt-4 pb-6">
        {[SIDEBAR_PROFILE_ITEM, SIDEBAR_BOTTOM_ITEM, SIDEBAR_GIVE_FEEDBACK_ITEM].map((item) => {
          const isActive =
            pathname === (item.activePrefix ?? item.href) ||
            (item.activePrefix != null && pathname.startsWith(item.activePrefix + '/'));

          return (
            <MobileNavItem
              key={item.labelKey}
              item={item}
              isActive={isActive}
              t={t}
              onSubNavClick={() => onItemClick(item)}
              onLinkClick={() => onClose()}
            />
          );
        })}
      </div>
    </>
  );
}

interface MobileNavSubLevelProps {
  selectedItem: NavItem;
  pathname: string;
  clientState: { search: string; hash: string } | null;
  t: (key: MessageKey) => string;
  onBack: () => void;
  onNavigate: () => void;
  breadcrumbSegments?: Record<string, string> | undefined;
  subPanelLinks?: SubPanelLink[] | undefined;
  subPanelBottomLinks?: SubPanelLink[] | undefined;
}

function MobileSubNavSkeleton() {
  return (
    <>
      <div className="px-2 pt-4">
        <div className="flex min-h-8 items-center gap-2 px-2.5">
          <div className="bg-muted size-4 shrink-0 animate-pulse rounded" />
          <div className="bg-muted h-3.5 w-24 animate-pulse rounded" />
        </div>
      </div>

      <div className="shrink-0 pt-2">
        <div className="flex h-9 items-center px-5">
          <div className="bg-muted h-3.5 w-28 animate-pulse rounded" />
        </div>
      </div>

      <div className="flex flex-col gap-2 p-2">
        <div className="flex min-h-8 items-center gap-2 px-2.5">
          <div className="bg-muted size-4 shrink-0 animate-pulse rounded" />
          <div className="bg-muted h-3.5 w-32 animate-pulse rounded" />
        </div>
      </div>
    </>
  );
}

export function MobileNavSubLevel({
  selectedItem,
  pathname,
  clientState,
  t,
  onBack,
  onNavigate,
  breadcrumbSegments,
  subPanelLinks,
  subPanelBottomLinks,
}: MobileNavSubLevelProps) {
  const parentHref = selectedItem.activePrefix ?? selectedItem.href;
  const dynamicTab = findDynamicTab(parentHref, pathname);
  const dynamicLabel = resolveDynamicLabel(dynamicTab, pathname, breadcrumbSegments);

  const isDynamicPending =
    dynamicTab != null && (dynamicLabel == null || !subPanelLinks || subPanelLinks.length === 0);

  if (isDynamicPending) {
    return <MobileSubNavSkeleton />;
  }

  const isDynamicActive = dynamicTab != null && dynamicLabel != null;
  const resolvedTitleKey =
    isDynamicActive && dynamicTab.titleKey ? dynamicTab.titleKey : selectedItem.subNav!.titleKey;

  return (
    <>
      <div className="px-2 pt-4">
        {isDynamicActive && subPanelLinks && subPanelLinks.length > 0 ? (
          <div className="flex flex-col gap-2">
            {subPanelLinks.map((link) =>
              link.disabled ? (
                <span
                  key={link.href}
                  data-state="inactive"
                  className={cn(SIDEBAR_NAV_ITEM_CLASSES, 'pointer-events-none opacity-50')}
                >
                  <link.icon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{link.label}</span>
                </span>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  data-state="inactive"
                  className={SIDEBAR_NAV_ITEM_CLASSES}
                >
                  <link.icon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{link.label}</span>
                </Link>
              )
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onBack}
            data-state="inactive"
            className={SIDEBAR_NAV_ITEM_CLASSES}
          >
            <ChevronLeft className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{t('common.actions.back')}</span>
          </button>
        )}
      </div>

      <div className="shrink-0 pt-2">
        <div className="flex h-9 items-center px-5">
          <h3 className="decoration-muted-foreground/50 text-sm font-semibold underline underline-offset-4">
            {t(resolvedTitleKey)}
          </h3>
        </div>
      </div>

      <SubNavItems
        groups={selectedItem.subNav!.groups}
        pathname={pathname}
        clientState={clientState}
        t={t}
        onNavigate={onNavigate}
        parentHref={parentHref}
        breadcrumbSegments={breadcrumbSegments}
      />

      {isDynamicActive && subPanelBottomLinks && subPanelBottomLinks.length > 0 && (
        <div className="flex flex-col gap-2 px-2">
          {subPanelBottomLinks.map((link) =>
            link.disabled ? (
              <span
                key={link.href + link.label}
                data-state="inactive"
                className={cn(SIDEBAR_NAV_ITEM_CLASSES, 'pointer-events-none opacity-50')}
              >
                <link.icon className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{link.label}</span>
              </span>
            ) : (
              <Link
                key={link.href + link.label}
                href={link.href}
                data-state="inactive"
                className={SIDEBAR_NAV_ITEM_CLASSES}
                onClick={onNavigate}
              >
                <link.icon className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{link.label}</span>
              </Link>
            )
          )}
        </div>
      )}
    </>
  );
}
