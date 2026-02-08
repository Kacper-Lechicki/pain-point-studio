import { ReactNode, Suspense } from 'react';

import { AuthToast } from '@/features/auth/components/common/auth-toast';
import { Navbar } from '@/features/dashboard/components/layout/navbar';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <Suspense>
        <AuthToast />
      </Suspense>

      <main className="flex-1">
        <div className="container mx-auto px-6 py-8 sm:px-4 lg:px-8">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
