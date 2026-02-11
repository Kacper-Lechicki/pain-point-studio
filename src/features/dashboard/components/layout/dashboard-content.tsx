'use client';

import type { ReactNode } from 'react';

import { useSidebar } from './sidebar-provider';

function getMarginLeft(isPinned: boolean, hasSubPanel: boolean): string {
  if (hasSubPanel) {
    return isPinned
      ? 'calc(var(--sidebar-width-expanded) + var(--sidebar-sub-panel-width))'
      : 'calc(var(--sidebar-width-collapsed) + var(--sidebar-sub-panel-width))';
  }

  return isPinned ? 'var(--sidebar-width-expanded)' : 'var(--sidebar-width-collapsed)';
}

export function DashboardContent({ children }: { children: ReactNode }) {
  const { isPinned, hasSubPanel, isDesktop } = useSidebar();

  return (
    <main
      className="min-w-0 flex-1 pb-20 transition-[margin-left] duration-200 ease-in-out"
      style={isDesktop ? { marginLeft: getMarginLeft(isPinned, hasSubPanel) } : undefined}
    >
      {children}
    </main>
  );
}
