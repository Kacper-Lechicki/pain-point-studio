'use client';

import type { ReactNode } from 'react';

import {
  getDashboardContentMarginLeft,
  getDashboardContentMaxWidth,
  isBuilderPath,
} from '@/features/dashboard/config/layout';
import { usePathname } from '@/i18n/routing';

import { DashboardContentArea } from './dashboard-content-area';
import { useSidebar } from './sidebar-provider';

export function DashboardContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isPinned, hasSubPanel, isDesktop } = useSidebar();
  const isBuilder = isBuilderPath(pathname ?? null);
  const maxWidth = getDashboardContentMaxWidth(pathname ?? null);

  return (
    <main
      className="min-h-0 min-w-0 flex-1 overflow-auto pb-20 transition-[margin-left] duration-200 ease-in-out"
      style={
        isDesktop ? { marginLeft: getDashboardContentMarginLeft(isPinned, hasSubPanel) } : undefined
      }
    >
      {isBuilder ? (
        children
      ) : (
        <DashboardContentArea maxWidth={maxWidth}>{children}</DashboardContentArea>
      )}
    </main>
  );
}
