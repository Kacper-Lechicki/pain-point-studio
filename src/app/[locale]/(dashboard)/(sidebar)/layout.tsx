import type { ReactNode } from 'react';

import { DashboardContent } from '@/features/dashboard/components/layout/dashboard-content';
import { MobileNav } from '@/features/dashboard/components/layout/mobile-nav';
import { Sidebar } from '@/features/dashboard/components/layout/sidebar';

export default function SidebarLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <MobileNav />
      <DashboardContent>{children}</DashboardContent>
    </div>
  );
}
