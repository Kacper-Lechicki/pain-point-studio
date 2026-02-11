'use client';

import { Lock, Unlock } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SIDEBAR_BOTTOM_ITEM } from '@/features/dashboard/config/navigation';
import { cn } from '@/lib/common/utils';

import { SidebarItem } from './sidebar-item';
import { SidebarNavList } from './sidebar-nav-list';
import { useSidebar } from './sidebar-provider';

export function Sidebar() {
  const { isExpanded, isPinned, hasSubPanel, togglePin, handleMouseEnter, handleMouseLeave } =
    useSidebar();
  const t = useTranslations('sidebar');

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: isExpanded ? 'var(--sidebar-width-expanded)' : 'var(--sidebar-width-collapsed)',
      }}
      className={cn(
        'bg-sidebar border-sidebar-border fixed top-14 left-0 z-40 hidden h-[calc(100vh-3.5rem)] flex-col overflow-hidden transition-[width] duration-200 ease-in-out lg:flex',
        // border-r logic:
        // – no sub-panel → always border-r
        // – sub-panel + overlay (hover, unpinned) → border-r (floats above sub-panel)
        // – sub-panel + pinned OR collapsed → no border-r (sub-panel's border-l suffices)
        (!hasSubPanel || (isExpanded && !isPinned)) && 'border-r',
        isExpanded && !isPinned && 'shadow-lg'
      )}
    >
      <nav
        className={cn(
          'flex flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto',
          isExpanded ? 'p-2' : 'px-1 py-2',
          !isExpanded && 'items-center'
        )}
      >
        <SidebarNavList isExpanded={isExpanded} />

        <div className={cn('mt-auto pt-1', !isExpanded && 'flex flex-col items-center')}>
          <SidebarItem {...SIDEBAR_BOTTOM_ITEM} isExpanded={isExpanded} disabled />
        </div>
      </nav>

      <div
        className={cn(
          'border-sidebar-border flex shrink-0 border-t',
          isExpanded ? 'justify-end p-2' : 'justify-center px-1 py-2'
        )}
      >
        <button
          onClick={togglePin}
          className="text-sidebar-foreground/50 hover:text-sidebar-foreground flex size-8 items-center justify-center rounded-md transition-colors"
          aria-label={isPinned ? t('unpinSidebar') : t('pinSidebar')}
        >
          {isPinned ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
        </button>
      </div>
    </aside>
  );
}
