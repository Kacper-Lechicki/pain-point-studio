import { ReactNode, Suspense } from 'react';

import { AuthToast } from '@/features/auth/components/common/auth-toast';
import { BreadcrumbProvider } from '@/features/dashboard/components/layout/breadcrumb-context';
import { DashboardLayoutChrome } from '@/features/dashboard/components/layout/dashboard-layout-chrome';
import { SidebarProvider } from '@/features/dashboard/components/layout/sidebar-provider';
import { getProfile } from '@/features/settings/actions';

const DashboardLayout = async ({ children }: { children: ReactNode }) => {
  const profile = await getProfile();

  return (
    <SidebarProvider>
      <BreadcrumbProvider>
        <DashboardLayoutChrome profile={profile}>{children}</DashboardLayoutChrome>
        <Suspense>
          <AuthToast />
        </Suspense>
      </BreadcrumbProvider>
    </SidebarProvider>
  );
};

export default DashboardLayout;
