'use client';

import { useCallback, useEffect, useState } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/common/utils';

import {
  SIDEBAR_NAV_ACTIVE,
  SIDEBAR_NAV_INACTIVE,
  SIDEBAR_NAV_ITEM_BASE,
  SIDEBAR_NAV_ITEM_CLASSES,
} from '../../config/nav-styles';
import type { SubNavGroup, SubNavItem } from '../../config/navigation';
import {
  type NavItem,
  SIDEBAR_BOTTOM_ITEM,
  SIDEBAR_NAV,
  findActiveNavItem,
} from '../../config/navigation';
import { ProjectSelector } from './project-selector';
import { useSidebar } from './sidebar-provider';

const TRANSITION = { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] as const };

function getSubItemHref(item: SubNavItem): string {
  if (item.searchParams) {
    const params = new URLSearchParams(item.searchParams);

    return `${item.href}?${params.toString()}${item.hash ? `#${item.hash}` : ''}`;
  }

  return item.hash ? `${item.href}#${item.hash}` : item.href;
}

// ── Shared sub-item active logic (same as secondary-nav) ─────────────

function isSubItemActive(
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

// ── Sub-nav items (extracted to use cn() instead of data-state) ──────

interface SubNavItemsProps {
  groups: SubNavGroup[];
  pathname: string;
  clientState: { search: string; hash: string } | null;
  t: ReturnType<typeof useTranslations>;
  onNavigate: () => void;
}

function SubNavItems({ groups, pathname, clientState, t, onNavigate }: SubNavItemsProps) {
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

  const currentSearchParams = clientState ? new URLSearchParams(clientState.search) : null;
  const hash = clientState?.hash ?? '';

  return (
    <nav className="flex flex-1 flex-col gap-2 p-2" onClick={onNavigate}>
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

              const isActive =
                clientState && currentSearchParams
                  ? hasSearchParamItems
                    ? isSubItemActive(subItem, pathname, hash, currentSearchParams, searchParamKeys)
                    : subItem.hash
                      ? pathname === subItem.href && hash === subItem.hash
                      : pathname === subItem.href ||
                        (subItem.alsoActiveFor?.includes(pathname) ?? false)
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
    </nav>
  );
}

export function MobileNav() {
  const { isMobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();
  const t = useTranslations();

  const [activeLevel, setActiveLevel] = useState<'main' | 'sub'>('main');
  const [selectedItem, setSelectedItem] = useState<NavItem | null>(null);
  const [skipSubEnterAnimation, setSkipSubEnterAnimation] = useState(false);

  // Read search params and hash exclusively on the client via
  // window.location to avoid the hydration mismatch caused by
  // useSearchParams() returning empty params during SSR.
  const [clientState, setClientState] = useState<{
    search: string;
    hash: string;
  } | null>(null);

  const syncFromWindow = useCallback(() => {
    setClientState({
      search: window.location.search.replace('?', ''),
      hash: window.location.hash.replace('#', ''),
    });
  }, []);

  useEffect(() => {
    queueMicrotask(syncFromWindow);
    window.addEventListener('hashchange', syncFromWindow);
    window.addEventListener('popstate', syncFromWindow);

    return () => {
      window.removeEventListener('hashchange', syncFromWindow);
      window.removeEventListener('popstate', syncFromWindow);
    };
  }, [syncFromWindow]);

  // Re-sync when pathname changes (client-side navigation via Next.js router)
  useEffect(() => {
    queueMicrotask(syncFromWindow);
  }, [pathname, syncFromWindow]);

  // When opening, detect if we're on a nested page and jump straight to its sub-nav.
  // This runs as a useEffect (not in onOpenChange) because the hamburger button in
  // navbar.tsx sets isMobileOpen directly — Radix's onOpenChange only fires on
  // internal state changes (overlay click, escape), not when the open prop changes.
  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const active = findActiveNavItem(pathname);

    if (!active?.subNav) {
      return;
    }

    const runSync = () => {
      setSkipSubEnterAnimation(true);
      setSelectedItem(active);
      setActiveLevel('sub');
    };

    queueMicrotask(runSync);
  }, [isMobileOpen, pathname]);

  const handleOpenChange = (open: boolean) => {
    setMobileOpen(open);

    if (!open) {
      setTimeout(() => {
        setActiveLevel('main');
        setSelectedItem(null);
        setSkipSubEnterAnimation(false);
      }, 200);
    }
  };

  const handleItemClick = (item: NavItem) => {
    if (item.disabled) {
      return;
    }

    if (item.subNav) {
      setSelectedItem(item);
      setActiveLevel('sub');
    } else {
      setMobileOpen(false);
    }
  };

  const handleBack = () => {
    setActiveLevel('main');
    setSelectedItem(null);
  };

  return (
    <Sheet open={isMobileOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="left"
        className="flex w-64 flex-col p-0"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <SheetHeader className="flex h-14 items-center justify-center px-3">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <ProjectSelector className="w-full" />
        </SheetHeader>

        <AnimatePresence mode="wait">
          {activeLevel === 'main' ? (
            <motion.div
              key="main"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={TRANSITION}
              className="flex flex-1 flex-col overflow-y-auto"
            >
              <nav className="flex flex-1 flex-col gap-2 p-2">
                {SIDEBAR_NAV.map((group, gi) => (
                  <div key={gi} className="flex flex-col gap-2">
                    {group.items.map((item) => {
                      const isActive = item.subNav
                        ? pathname === item.href || pathname.startsWith(item.href + '/')
                        : pathname === item.href;

                      if (item.subNav) {
                        return (
                          <button
                            key={item.href}
                            type="button"
                            data-state={isActive ? 'active' : 'inactive'}
                            onClick={() => handleItemClick(item)}
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
                          onClick={() => handleItemClick(item)}
                          className={SIDEBAR_NAV_ITEM_CLASSES}
                        >
                          <item.icon className="size-4 shrink-0" aria-hidden />
                          <span className="truncate">{t(item.labelKey)}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>

              <div className="border-t p-2">
                {(() => {
                  const isBottomActive =
                    pathname === SIDEBAR_BOTTOM_ITEM.href ||
                    pathname.startsWith(SIDEBAR_BOTTOM_ITEM.href + '/');

                  return SIDEBAR_BOTTOM_ITEM.subNav ? (
                    <button
                      type="button"
                      data-state={isBottomActive ? 'active' : 'inactive'}
                      className={SIDEBAR_NAV_ITEM_CLASSES}
                      onClick={() => handleItemClick(SIDEBAR_BOTTOM_ITEM)}
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
                      onClick={() => setMobileOpen(false)}
                    >
                      <SIDEBAR_BOTTOM_ITEM.icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{t(SIDEBAR_BOTTOM_ITEM.labelKey)}</span>
                    </Link>
                  );
                })()}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="sub"
              initial={skipSubEnterAnimation ? false : { x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={TRANSITION}
              className="flex flex-1 flex-col overflow-y-auto"
            >
              {/* Back button — same style as other nav items */}
              <div className="px-2 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  data-state="inactive"
                  className={SIDEBAR_NAV_ITEM_CLASSES}
                >
                  <ChevronLeft className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{t('sidebar.back')}</span>
                </button>
              </div>

              {/* Title — matches desktop sub-panel style */}
              <div className="shrink-0 pt-2">
                <div className="flex h-9 items-center px-5">
                  <h3 className="decoration-border text-sm font-semibold underline underline-offset-4">
                    {t(selectedItem!.subNav!.titleKey)}
                  </h3>
                </div>
              </div>

              {/* Sub-nav items */}
              <SubNavItems
                groups={selectedItem!.subNav!.groups}
                pathname={pathname}
                clientState={clientState}
                t={t}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}
