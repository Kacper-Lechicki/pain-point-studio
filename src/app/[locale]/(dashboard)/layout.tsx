import { ReactNode, Suspense } from 'react';

import { AuthToast } from '@/features/auth/components/common/auth-toast';
import { Navbar } from '@/features/dashboard/components/layout/navbar';
import { getProfile } from '@/features/settings/actions';
import { CompleteProfileModal } from '@/features/settings/components/complete-profile-modal';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = async ({ children }: DashboardLayoutProps) => {
  const profile = await getProfile();

  const needsCompletion = profile && (!profile.fullName || !profile.role);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <Suspense>
        <AuthToast />
      </Suspense>

      <main className="flex-1">
        <div className="container mx-auto px-6 pt-4 pb-8 sm:px-4 md:pt-8 lg:px-8">{children}</div>
      </main>

      {needsCompletion && (
        <CompleteProfileModal
          roleOptions={profile.roleOptions}
          currentFullName={profile.fullName}
          currentRole={profile.role}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
