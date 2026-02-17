'use client';

import { Suspense } from 'react';

import { AnimatePresence, motion } from 'motion/react';

import { SecondaryNav } from '@/features/dashboard/components/layout/secondary-nav';
import { useSidebar } from '@/features/dashboard/components/layout/sidebar-provider';

export function SubPanel() {
  const { activeNavItem, hasSubPanel, isPinned } = useSidebar();

  return (
    <AnimatePresence>
      {hasSubPanel && activeNavItem?.subNav && (
        <motion.aside
          key={activeNavItem.href}
          initial={{ width: 0, opacity: 0 }}
          animate={{
            width: 'var(--sidebar-sub-panel-width)',
            opacity: 1,
          }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            left: isPinned ? 'var(--sidebar-width-expanded)' : 'var(--sidebar-width-collapsed)',
          }}
          className="bg-sidebar border-sidebar-border dashboard:block fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] overflow-hidden border-r border-l transition-[left] duration-200 ease-in-out"
        >
          <div className="flex h-full flex-col" style={{ width: 'var(--sidebar-sub-panel-width)' }}>
            <Suspense>
              <SecondaryNav
                titleKey={activeNavItem.subNav.titleKey}
                groups={activeNavItem.subNav.groups}
                parentHref={activeNavItem.href}
              />
            </Suspense>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
