'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/routing';

import { SIDEBAR_NAV_ITEM_CLASSES } from '../../config/nav-styles';
import { useSidebar } from './sidebar-provider';

export function SubPanel() {
  const { activeNavItem, hasSubPanel, isPinned } = useSidebar();
  const pathname = usePathname();
  const t = useTranslations();

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
          className="bg-sidebar border-sidebar-border fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] overflow-hidden border-r border-l transition-[left] duration-200 ease-in-out lg:block"
        >
          <div className="flex h-full flex-col" style={{ width: 'var(--sidebar-sub-panel-width)' }}>
            {/*
              Title vertical alignment with main sidebar "Home" item:
              pt-2 (8px) + h-9 inner (36px, text centered at +18px) → text center at 26px
              = main sidebar: 8px nav-pad + 18px (half of 36px item) = 26px ✓
              Total: 8px + 36px = 44px. Nav pt-2 (8px) → first item at 52px. ✓
            */}
            <div className="shrink-0 pt-2">
              <div className="flex h-9 items-center px-5">
                <h2 className="text-sidebar-foreground decoration-sidebar-border text-sm font-semibold underline underline-offset-4">
                  {t(activeNavItem.subNav.titleKey)}
                </h2>
              </div>
            </div>

            <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pt-2 pb-2">
              {activeNavItem.subNav.groups.map((group, gi) => (
                <div key={gi}>
                  {group.headingKey && (
                    <div className="text-sidebar-foreground/50 mt-3 mb-1 px-3 text-xs font-semibold tracking-wider uppercase first:mt-0">
                      {t(group.headingKey)}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
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
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
