'use client';

import type { ReactNode } from 'react';

import { DashboardContentArea } from '@/features/dashboard/components/layout/dashboard-content-area';
import { useSidebar } from '@/features/dashboard/components/layout/sidebar-provider';
import {
  getDashboardContentMarginLeft,
  getDashboardContentMaxWidth,
  isBuilderPath,
} from '@/features/dashboard/config/layout';
import { usePathname } from '@/i18n/routing';

export function DashboardContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isPinned, subPanelVisible, hasSubPanel, isDesktop } = useSidebar();
  const isBuilder = isBuilderPath(pathname ?? null);
  const maxWidth = getDashboardContentMaxWidth(pathname ?? null);
  const hasSubPanelClosed = hasSubPanel && !subPanelVisible;

  return (
    <main
      className="min-h-min min-w-0 flex-1 transition-[margin-left] duration-200 ease-in-out"
      style={
        isDesktop
          ? {
              marginLeft: getDashboardContentMarginLeft(
                isPinned,
                subPanelVisible,
                hasSubPanelClosed
              ),
            }
          : undefined
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
