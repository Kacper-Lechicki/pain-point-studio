'use client';

import type { ReactNode } from 'react';

import { getDashboardContentMaxWidth, isBuilderPath } from '@/features/dashboard/config/layout';
import { usePathname } from '@/i18n/routing';

import { DashboardContentArea } from './dashboard-content-area';
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
  const pathname = usePathname();
  const { isPinned, hasSubPanel, isDesktop } = useSidebar();
  const isBuilder = isBuilderPath(pathname ?? null);
  const maxWidth = getDashboardContentMaxWidth(pathname ?? null);

  return (
    <main
      className="min-w-0 flex-1 pb-20 transition-[margin-left] duration-200 ease-in-out"
      style={isDesktop ? { marginLeft: getMarginLeft(isPinned, hasSubPanel) } : undefined}
    >
      {isBuilder ? (
        children
      ) : (
        <DashboardContentArea maxWidth={maxWidth}>{children}</DashboardContentArea>
      )}
    </main>
  );
}
