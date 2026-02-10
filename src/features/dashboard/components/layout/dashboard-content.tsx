'use client';

import type { ReactNode } from 'react';

import { useSidebar } from './sidebar-provider';

export function DashboardContent({ children }: { children: ReactNode }) {
  const { isPinned } = useSidebar();

  // CSS handles collapsed margin at lg+ (SSR-safe, no hydration flash).
  // JS only overrides when pinned to use expanded width.
  return (
    <main
      className="min-w-0 flex-1 transition-[margin-left] duration-200 lg:ml-(--sidebar-width-collapsed)"
      style={isPinned ? { marginLeft: 'var(--sidebar-width-expanded)' } : undefined}
    >
      {children}
    </main>
  );
}
