'use client';

import { Lock, Unlock } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SidebarItem } from '@/features/dashboard/components/layout/sidebar-item';
import { SidebarNavList } from '@/features/dashboard/components/layout/sidebar-nav-list';
import { useSidebar } from '@/features/dashboard/components/layout/sidebar-provider';
import { DASHBOARD_FOOTER_HEIGHT_CLASS } from '@/features/dashboard/config/layout';
import { SIDEBAR_BOTTOM_ITEM, SIDEBAR_PROFILE_ITEM } from '@/features/dashboard/config/navigation';
import { cn } from '@/lib/common/utils';

export function Sidebar() {
  const { isExpanded, isPinned, hasSubPanel, togglePin, handleMouseEnter, handleMouseLeave } =
    useSidebar();

  const t = useTranslations();

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: isExpanded ? 'var(--sidebar-width-expanded)' : 'var(--sidebar-width-collapsed)',
      }}
      className={cn(
        'bg-sidebar border-sidebar-border dashboard:flex fixed top-14 left-0 z-40 hidden h-[calc(100vh-3.5rem)] flex-col overflow-hidden transition-[width] duration-200 ease-in-out',
        (!hasSubPanel || (isExpanded && !isPinned)) && 'border-r',
        isExpanded && !isPinned && 'shadow-lg'
      )}
    >
      <nav
        className={cn(
          'flex flex-1 flex-col gap-1.5 overflow-x-hidden overflow-y-auto pb-4',
          isExpanded ? 'px-2 pt-4' : 'px-1 pt-4',
          !isExpanded && 'items-center'
        )}
      >
        <SidebarNavList isExpanded={isExpanded} />

        <div className={cn('mt-auto flex flex-col gap-1.5 pt-4', !isExpanded && 'items-center')}>
          <SidebarItem
            {...SIDEBAR_PROFILE_ITEM}
            isExpanded={isExpanded}
            hasSubNav={!!SIDEBAR_PROFILE_ITEM.subNav}
          />
          <SidebarItem
            {...SIDEBAR_BOTTOM_ITEM}
            isExpanded={isExpanded}
            hasSubNav={!!SIDEBAR_BOTTOM_ITEM.subNav}
          />
        </div>
      </nav>

      <div
        className={cn(
          'border-sidebar-border flex shrink-0 items-center border-t',
          DASHBOARD_FOOTER_HEIGHT_CLASS,
          isExpanded ? 'justify-end px-2' : 'justify-center px-1'
        )}
      >
        <button
          onClick={togglePin}
          className="text-sidebar-foreground/50 hover:text-sidebar-foreground flex size-7 items-center justify-center rounded-md transition-colors"
          aria-label={isPinned ? t('sidebar.unpinSidebar') : t('sidebar.pinSidebar')}
        >
          {isPinned ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
        </button>
      </div>
    </aside>
  );
}
