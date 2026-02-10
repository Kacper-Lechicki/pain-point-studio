'use client';

import type { ReactNode } from 'react';

import { useSidebar } from './sidebar-provider';

export function DashboardContent({ children }: { children: ReactNode }) {
  const { isPinned } = useSidebar();

  return (
    <main
      className="min-w-0 flex-1 pb-20 transition-[margin-left] duration-200 lg:ml-(--sidebar-width-collapsed)"
      style={isPinned ? { marginLeft: 'var(--sidebar-width-expanded)' } : undefined}
    >
      {children}
    </main>
  );
}
