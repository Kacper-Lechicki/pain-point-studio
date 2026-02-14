import { redirect } from 'next/navigation';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { DashboardPageBack } from '@/features/dashboard/components/layout/dashboard-page-back';
import { getProfileStatistics } from '@/features/profile/actions/get-profile-statistics';
import { ProfileView } from '@/features/profile/components';
import type { ProfilePreviewData } from '@/features/profile/types';
import { getProfile } from '@/features/settings/actions';

export default async function ProfilePreviewRoute() {
  const [profile, statistics] = await Promise.all([getProfile(), getProfileStatistics()]);

  if (!profile) {
    redirect(ROUTES.auth.signIn);
  }

  const roleLabel = profile.roleOptions.find((r) => r.value === profile.role)?.label ?? '';

  const previewData: ProfilePreviewData = {
    fullName: profile.fullName,
    role: roleLabel,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    socialLinks: profile.socialLinks,
    memberSince: profile.memberSince,
  };

  return (
    <>
      <DashboardPageBack />
      <PageTransition>
        <ProfileView profile={previewData} statistics={statistics} isPreview />
      </PageTransition>
    </>
  );
}
