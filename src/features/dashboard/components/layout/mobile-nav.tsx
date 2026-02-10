'use client';

import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SIDEBAR_BOTTOM_ITEM, SIDEBAR_NAV } from '@/features/dashboard/config/navigation';

import { ProjectSelector } from './project-selector';
import { SidebarItem } from './sidebar-item';
import { useSidebar } from './sidebar-provider';

export function MobileNav() {
  const { isMobileOpen, setMobileOpen } = useSidebar();

  return (
    <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent
        side="left"
        className="flex w-64 flex-col p-0"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <SheetHeader className="flex h-14 items-center justify-center border-b px-3">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <ProjectSelector className="w-full" />
        </SheetHeader>

        <nav
          className="flex flex-1 flex-col gap-1 overflow-y-auto p-2"
          onClick={() => setMobileOpen(false)}
        >
          {SIDEBAR_NAV.map((group, i) => (
            <div key={i}>
              {i > 0 && <Separator className="my-2" />}
              <div className="flex flex-col gap-2">
                {group.items.map((item) => (
                  <SidebarItem key={item.href} {...item} isExpanded />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t p-2" onClick={() => setMobileOpen(false)}>
          <SidebarItem {...SIDEBAR_BOTTOM_ITEM} isExpanded />
        </div>
      </SheetContent>
    </Sheet>
  );
}
