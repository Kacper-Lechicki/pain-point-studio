'use client';

import type { ReactNode } from 'react';

import type { ProfileData } from '@/features/settings/actions';
import { CompleteProfileModal } from '@/features/settings/components/complete-profile-modal';
import { usePathname } from '@/i18n/routing';

import { isBuilderPath } from '../../config/layout';
import { DashboardContent } from './dashboard-content';
import { DashboardFooter } from './dashboard-footer';
import { MobileNav } from './mobile-nav';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { SubPanel } from './sub-panel';

interface DashboardLayoutChromeProps {
  children: ReactNode;
  profile: ProfileData | null;
}

export function DashboardLayoutChrome({ children, profile }: DashboardLayoutChromeProps) {
  const pathname = usePathname();
  const isBuilder = isBuilderPath(pathname ?? null);
  const needsCompletion = profile && (!profile.fullName || !profile.role);

  if (isBuilder) {
    return (
      <div className="flex h-screen max-h-screen min-h-screen flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
        <DashboardFooter />
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen flex-col pt-14">
        <Navbar />
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <SubPanel />
          <MobileNav />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <DashboardContent>{children}</DashboardContent>
            <DashboardFooter />
          </div>
        </div>
      </div>
      {needsCompletion && profile && (
        <CompleteProfileModal
          roleOptions={profile.roleOptions}
          currentFullName={profile.fullName}
          currentRole={profile.role}
        />
      )}
    </>
  );
}
