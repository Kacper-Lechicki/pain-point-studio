import { ReactNode, Suspense } from 'react';

import { AuthToast } from '@/features/auth/components/common/auth-toast';
import { BreadcrumbProvider } from '@/features/dashboard/components/layout/breadcrumb-context';
import { DashboardLayoutChrome } from '@/features/dashboard/components/layout/dashboard-layout-chrome';
import { SidebarProvider } from '@/features/dashboard/components/layout/sidebar-provider';
import { getProfile } from '@/features/settings/actions';
import { UnsavedChangesProvider } from '@/hooks/unsaved-changes-context';

const DashboardLayout = async ({ children }: { children: ReactNode }) => {
  const profile = await getProfile();

  return (
    <UnsavedChangesProvider>
      <SidebarProvider>
        <BreadcrumbProvider>
          <DashboardLayoutChrome profile={profile}>{children}</DashboardLayoutChrome>

          <Suspense>
            <AuthToast />
          </Suspense>
        </BreadcrumbProvider>
      </SidebarProvider>
    </UnsavedChangesProvider>
  );
};

export default DashboardLayout;
