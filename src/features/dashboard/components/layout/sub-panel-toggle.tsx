'use client';

import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useSidebar } from '@/features/dashboard/components/layout/sidebar-provider';
import { SUBPANEL_TOGGLE_STRIP_WIDTH } from '@/features/dashboard/config/layout';
import { cn } from '@/lib/common/utils';

/**
 * When sub-panel is closed: thin vertical strip immediately to the right of the main sidebar.
 * Position follows main sidebar width (expanded/collapsed). Click to open sub-panel. Desktop only.
 */
export function SubPanelToggle() {
  const { isDesktop, hasSubPanel, subPanelOpen, isExpanded, toggleSubPanel } = useSidebar();
  const t = useTranslations();

  if (!isDesktop || !hasSubPanel || subPanelOpen) {
    return null;
  }

  const sidebarWidth = isExpanded
    ? 'var(--sidebar-width-expanded)'
    : 'var(--sidebar-width-collapsed)';

  return (
    <button
      type="button"
      onClick={toggleSubPanel}
      style={{
        left: sidebarWidth,
        width: SUBPANEL_TOGGLE_STRIP_WIDTH,
        top: '3.5rem',
        height: 'calc(100vh - 3.5rem)',
      }}
      className={cn(
        'bg-sidebar border-sidebar-border fixed z-30 hidden shrink-0 cursor-pointer items-center justify-center border-r transition-[left] duration-200 ease-out',
        'dashboard:flex'
      )}
      aria-label={t('sidebar.showSubpanel')}
    >
      <span className="text-sidebar-foreground/60 flex size-6 items-center justify-center">
        <ChevronRight className="size-4" strokeWidth={2.5} />
      </span>
    </button>
  );
}
