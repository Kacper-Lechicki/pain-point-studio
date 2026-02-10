import { ReactNode, Suspense } from 'react';

import { AuthToast } from '@/features/auth/components/common/auth-toast';
import { Navbar } from '@/features/dashboard/components/layout/navbar';
import { SidebarProvider } from '@/features/dashboard/components/layout/sidebar-provider';
import { getProfile } from '@/features/settings/actions';
import { CompleteProfileModal } from '@/features/settings/components/complete-profile-modal';

const DashboardLayout = async ({ children }: { children: ReactNode }) => {
  const profile = await getProfile();
  const needsCompletion = profile && (!profile.fullName || !profile.role);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col pt-14">
        <Navbar />

        <Suspense>
          <AuthToast />
        </Suspense>

        {children}

        {needsCompletion && (
          <CompleteProfileModal
            roleOptions={profile.roleOptions}
            currentFullName={profile.fullName}
            currentRole={profile.role}
          />
        )}
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
