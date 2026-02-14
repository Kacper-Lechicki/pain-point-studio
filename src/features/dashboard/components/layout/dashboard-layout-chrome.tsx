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
      <div className="flex h-screen max-h-screen flex-col overflow-hidden">
        <Navbar />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Sidebar />
          <SubPanel />
          <MobileNav />
          <div className="flex min-h-full min-w-0 flex-1 flex-col overflow-auto">
            <div className="h-14 shrink-0" aria-hidden="true" />
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
