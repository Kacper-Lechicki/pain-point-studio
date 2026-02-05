import { ReactNode } from 'react';

import { PageTransition } from '@/components/ui/page-transition';
import { DashboardNavbar } from '@/features/dashboard/components/layout/dashboard-navbar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNavbar />

      <main className="flex-1">
        <PageTransition>
          <div className="container mx-auto px-6 py-8 sm:px-4 lg:px-8">{children}</div>
        </PageTransition>
      </main>
    </div>
  );
}
