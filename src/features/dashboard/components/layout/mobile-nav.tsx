'use client';

import { useState } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/common/utils';

import { SIDEBAR_NAV_ITEM_CLASSES } from '../../config/nav-styles';
import { type NavItem, SIDEBAR_BOTTOM_ITEM, SIDEBAR_NAV } from '../../config/navigation';
import { ProjectSelector } from './project-selector';
import { useSidebar } from './sidebar-provider';

const TRANSITION = { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] as const };

export function MobileNav() {
  const { isMobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();
  const t = useTranslations();

  const [activeLevel, setActiveLevel] = useState<'main' | 'sub'>('main');
  const [selectedItem, setSelectedItem] = useState<NavItem | null>(null);

  const handleOpenChange = (open: boolean) => {
    setMobileOpen(open);

    if (!open) {
      setTimeout(() => {
        setActiveLevel('main');
        setSelectedItem(null);
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
                <span
                  data-state="inactive"
                  className={cn(SIDEBAR_NAV_ITEM_CLASSES, 'pointer-events-none opacity-50')}
                >
                  <SIDEBAR_BOTTOM_ITEM.icon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{t(SIDEBAR_BOTTOM_ITEM.labelKey)}</span>
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="sub"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={TRANSITION}
              className="flex flex-1 flex-col overflow-y-auto"
            >
              {/* Back button */}
              <div className="px-2 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-muted-foreground hover:text-foreground flex min-h-10 items-center gap-2 px-1 text-sm font-medium transition-colors"
                >
                  <ChevronLeft className="size-4" />
                  {t('sidebar.back')}
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
              <nav className="flex flex-1 flex-col gap-2 p-2" onClick={() => setMobileOpen(false)}>
                {selectedItem!.subNav!.groups.map((group, gi) => (
                  <div key={gi}>
                    {group.headingKey && (
                      <div className="text-muted-foreground mt-3 mb-1 px-3 text-xs font-semibold tracking-wider uppercase first:mt-0">
                        {t(group.headingKey)}
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      {group.items.map((subItem) => {
                        const isActive = pathname === subItem.href;

                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            data-state={isActive ? 'active' : 'inactive'}
                            className={SIDEBAR_NAV_ITEM_CLASSES}
                          >
                            <subItem.icon className="size-4 shrink-0" aria-hidden />
                            <span className="truncate">{t(subItem.labelKey)}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}
