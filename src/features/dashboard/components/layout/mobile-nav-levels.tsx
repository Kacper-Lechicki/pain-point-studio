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
  SIDEBAR_NAV,
} from '@/features/dashboard/config/navigation';
import {
  collectSearchParamKeys,
  findDynamicTab,
  getSubItemHref,
  isSubItemActive,
  resolveDynamicLabel,
} from '@/features/dashboard/lib/nav-utils';
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

export function SubNavItems({
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
      {groups.map((group, gi) => (
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

              const isActive = isDynamicActive
                ? false
                : clientState && currentSearchParams
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
      ))}

      {isDynamicActive && dynamicTab && dynamicLabel && (
        <div>
          <div className="text-muted-foreground mt-6 mb-1 px-3 text-xs font-semibold tracking-wider uppercase">
            {t('sidebar.dynamicHeading' as MessageKey)}
          </div>

          <div className="flex flex-col gap-2">
            <Link href={pathname} className={cn(SIDEBAR_NAV_ITEM_BASE, SIDEBAR_NAV_ACTIVE)}>
              <dynamicTab.icon className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{dynamicLabel}</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
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
              if (item.disabled) {
                return (
                  <span
                    key={item.href}
                    data-state="inactive"
                    className={cn(SIDEBAR_NAV_ITEM_CLASSES, 'pointer-events-none opacity-50')}
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{t(item.labelKey)}</span>
                  </span>
                );
              }

              const matchPath = item.activePrefix ?? item.href;

              const isActive = item.subNav
                ? pathname === matchPath || pathname.startsWith(matchPath + '/')
                : pathname === matchPath;

              if (item.subNav) {
                return (
                  <button
                    key={item.href}
                    type="button"
                    data-state={isActive ? 'active' : 'inactive'}
                    onClick={() => onItemClick(item)}
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
                  key={item.href}
                  href={item.href}
                  data-state={isActive ? 'active' : 'inactive'}
                  onClick={() => onItemClick(item)}
                  className={SIDEBAR_NAV_ITEM_CLASSES}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        ))}

        {DYNAMIC_SIDEBAR_ITEMS.some((di) => pathname === di.path) && (
          <div className="mt-2 flex flex-col gap-2">
            <div className="text-muted-foreground mt-4 mb-1 px-3 text-xs font-semibold tracking-wider uppercase">
              {t('sidebar.dynamicHeading' as Parameters<typeof t>[0])}
            </div>

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

      <div className="px-2 pb-6">
        {(() => {
          if (SIDEBAR_BOTTOM_ITEM.disabled) {
            return (
              <span
                data-state="inactive"
                className={cn(SIDEBAR_NAV_ITEM_CLASSES, 'pointer-events-none opacity-50')}
              >
                <SIDEBAR_BOTTOM_ITEM.icon className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{t(SIDEBAR_BOTTOM_ITEM.labelKey)}</span>
              </span>
            );
          }

          const isBottomActive =
            pathname === SIDEBAR_BOTTOM_ITEM.href ||
            pathname.startsWith(SIDEBAR_BOTTOM_ITEM.href + '/');

          return SIDEBAR_BOTTOM_ITEM.subNav ? (
            <button
              type="button"
              data-state={isBottomActive ? 'active' : 'inactive'}
              className={SIDEBAR_NAV_ITEM_CLASSES}
              onClick={() => onItemClick(SIDEBAR_BOTTOM_ITEM)}
            >
              <SIDEBAR_BOTTOM_ITEM.icon className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{t(SIDEBAR_BOTTOM_ITEM.labelKey)}</span>
              <ChevronRight className="ml-auto size-4 opacity-50" />
            </button>
          ) : (
            <Link
              href={SIDEBAR_BOTTOM_ITEM.href}
              data-state={isBottomActive ? 'active' : 'inactive'}
              className={SIDEBAR_NAV_ITEM_CLASSES}
              onClick={() => onClose()}
            >
              <SIDEBAR_BOTTOM_ITEM.icon className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{t(SIDEBAR_BOTTOM_ITEM.labelKey)}</span>
            </Link>
          );
        })()}
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
}

export function MobileNavSubLevel({
  selectedItem,
  pathname,
  clientState,
  t,
  onBack,
  onNavigate,
  breadcrumbSegments,
}: MobileNavSubLevelProps) {
  return (
    <>
      <div className="px-2 pt-4">
        <button
          type="button"
          onClick={onBack}
          data-state="inactive"
          className={SIDEBAR_NAV_ITEM_CLASSES}
        >
          <ChevronLeft className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{t('sidebar.back')}</span>
        </button>
      </div>

      <div className="shrink-0 pt-2">
        <div className="flex h-9 items-center px-5">
          <h3 className="decoration-border text-sm font-semibold underline underline-offset-4">
            {t(selectedItem.subNav!.titleKey)}
          </h3>
        </div>
      </div>

      <SubNavItems
        groups={selectedItem.subNav!.groups}
        pathname={pathname}
        clientState={clientState}
        t={t}
        onNavigate={onNavigate}
        parentHref={selectedItem.activePrefix ?? selectedItem.href}
        breadcrumbSegments={breadcrumbSegments}
      />
    </>
  );
}
