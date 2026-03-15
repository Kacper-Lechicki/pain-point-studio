'use client';

import { Suspense } from 'react';

import { PanelLeftClose } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { SecondaryNav } from '@/features/dashboard/components/layout/secondary-nav';
import { useSidebar } from '@/features/dashboard/components/layout/sidebar-provider';
import { DASHBOARD_FOOTER_HEIGHT_CLASS } from '@/features/dashboard/config/layout';
import { cn } from '@/lib/common/utils';

export function SubPanel() {
  const { activeNavItem, hasSubPanel, subPanelOpen, isPinned, isDesktop, toggleSubPanel } =
    useSidebar();
  const t = useTranslations();
  const prefersReducedMotion = useReducedMotion();

  const subNav = activeNavItem?.subNav;
  const showPanel = hasSubPanel && subNav && subPanelOpen;

  return (
    <AnimatePresence>
      {showPanel && activeNavItem && subNav && (
        <motion.aside
          key={activeNavItem.href}
          initial={prefersReducedMotion ? false : { width: 0, opacity: 0 }}
          animate={{
            width: 'var(--sidebar-sub-panel-width)',
            opacity: 1,
          }}
          exit={prefersReducedMotion ? { opacity: 0 } : { width: 0, opacity: 0 }}
          transition={
            prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }
          }
          style={{
            left: isPinned ? 'var(--sidebar-width-expanded)' : 'var(--sidebar-width-collapsed)',
          }}
          className="bg-sidebar border-sidebar-border dashboard:flex fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] flex-col overflow-hidden border-r border-l transition-[left] duration-200 ease-in-out"
        >
          <div
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            style={{ width: 'var(--sidebar-sub-panel-width)' }}
          >
            <Suspense>
              <SecondaryNav
                titleKey={subNav.titleKey}
                groups={subNav.groups}
                parentHref={activeNavItem.activePrefix ?? activeNavItem.href}
              />
            </Suspense>
          </div>

          {isDesktop && (
            <div
              className={cn(
                'border-sidebar-border flex shrink-0 items-center justify-end border-t',
                DASHBOARD_FOOTER_HEIGHT_CLASS,
                'px-2'
              )}
            >
              <button
                type="button"
                onClick={toggleSubPanel}
                className="text-sidebar-foreground/50 md:hover:text-sidebar-foreground flex size-7 items-center justify-center rounded-md transition-colors"
                aria-label={t('sidebar.hideSubpanel')}
              >
                <PanelLeftClose className="size-3.5" />
              </button>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
