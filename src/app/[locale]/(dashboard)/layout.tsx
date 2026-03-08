import { ReactNode, Suspense } from 'react';

import { redirect } from 'next/navigation';

import { ROUTES } from '@/config';
import { AuthToast } from '@/features/auth/components/common/auth-toast';
import { BreadcrumbProvider } from '@/features/dashboard/components/layout/breadcrumb-context';
import { DashboardLayoutChrome } from '@/features/dashboard/components/layout/dashboard-layout-chrome';
import { SidebarProvider } from '@/features/dashboard/components/layout/sidebar-provider';
import { SubPanelItemsProvider } from '@/features/dashboard/components/layout/sub-panel-items-context';
import { getProfile } from '@/features/settings/actions';
import { UnsavedChangesProvider } from '@/hooks/unsaved-changes-context';

const DashboardLayout = async ({ children }: { children: ReactNode }) => {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.auth.signIn);
  }

  return (
    <UnsavedChangesProvider>
      <SidebarProvider>
        <BreadcrumbProvider>
          <SubPanelItemsProvider>
            <DashboardLayoutChrome profile={profile}>{children}</DashboardLayoutChrome>

            <Suspense fallback={null}>
              <AuthToast />
            </Suspense>
          </SubPanelItemsProvider>
        </BreadcrumbProvider>
      </SidebarProvider>
    </UnsavedChangesProvider>
  );
};

export default DashboardLayout;
