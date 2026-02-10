'use client';

import { Lock, Unlock } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SIDEBAR_BOTTOM_ITEM } from '@/features/dashboard/config/navigation';

import { SidebarItem } from './sidebar-item';
import { SidebarNavList } from './sidebar-nav-list';
import { useSidebar } from './sidebar-provider';

export function Sidebar() {
  const { isExpanded, isPinned, togglePin, handleMouseEnter, handleMouseLeave } = useSidebar();
  const t = useTranslations('sidebar');

  return (
    <TooltipProvider>
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          width: isExpanded ? 'var(--sidebar-width-expanded)' : 'var(--sidebar-width-collapsed)',
          boxShadow: isExpanded && !isPinned ? '4px 0 12px rgba(0,0,0,0.08)' : 'none',
        }}
        className="bg-sidebar border-sidebar-border fixed top-14 left-0 z-40 hidden h-[calc(100vh-3.5rem)] flex-col border-r transition-[width] duration-200 ease-in-out lg:flex"
      >
        <nav className="flex flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto p-2">
          <SidebarNavList isExpanded={isExpanded} />

          <div className="mt-auto pt-1">
            <SidebarItem {...SIDEBAR_BOTTOM_ITEM} isExpanded={isExpanded} />
          </div>
        </nav>

        <div
          className={`border-sidebar-border flex border-t p-2 ${isExpanded ? 'justify-end' : 'justify-center'}`}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={togglePin}
                className="text-sidebar-foreground/50 hover:text-sidebar-foreground flex size-8 items-center justify-center rounded-md transition-colors"
                aria-label={isPinned ? t('unpinSidebar') : t('pinSidebar')}
              >
                {isPinned ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {isPinned ? t('unpinSidebar') : t('pinSidebar')}
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
