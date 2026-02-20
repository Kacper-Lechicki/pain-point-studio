'use client';

import { useCallback, useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useBreadcrumbContext } from '@/features/dashboard/components/layout/breadcrumb-context';
import {
  MobileNavMainLevel,
  MobileNavSubLevel,
} from '@/features/dashboard/components/layout/mobile-nav-levels';
import { ProjectSelector } from '@/features/dashboard/components/layout/project-selector';
import { useSidebar } from '@/features/dashboard/components/layout/sidebar-provider';
import type { NavItem } from '@/features/dashboard/config/navigation';
import { findActiveNavItem } from '@/features/dashboard/config/navigation';
import { getHash } from '@/features/dashboard/hooks/use-hash-sync';
import { usePathname } from '@/i18n/routing';

const TRANSITION = { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] as const };

export function MobileNav() {
  const { isMobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();
  const t = useTranslations();
  const breadcrumb = useBreadcrumbContext();

  const [activeLevel, setActiveLevel] = useState<'main' | 'sub'>('main');
  const [selectedItem, setSelectedItem] = useState<NavItem | null>(null);
  const [skipSubEnterAnimation, setSkipSubEnterAnimation] = useState(false);

  const [clientState, setClientState] = useState<{
    search: string;
    hash: string;
  } | null>(null);

  const syncFromWindow = useCallback(() => {
    setClientState({
      search: window.location.search.replace('?', ''),
      hash: getHash(),
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

  useEffect(() => {
    queueMicrotask(syncFromWindow);
  }, [pathname, syncFromWindow]);

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
        <SheetHeader className="flex h-14 items-center justify-start px-3">
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
              <MobileNavMainLevel
                pathname={pathname}
                t={t}
                onItemClick={handleItemClick}
                onClose={() => setMobileOpen(false)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="sub"
              initial={skipSubEnterAnimation ? false : { x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={TRANSITION}
              className="flex flex-1 flex-col overflow-y-auto pb-8"
            >
              <MobileNavSubLevel
                selectedItem={selectedItem!}
                pathname={pathname}
                clientState={clientState}
                t={t}
                onBack={handleBack}
                onNavigate={() => setMobileOpen(false)}
                breadcrumbSegments={breadcrumb?.segments}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}
