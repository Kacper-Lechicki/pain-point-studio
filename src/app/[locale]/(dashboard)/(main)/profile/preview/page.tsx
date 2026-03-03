import { redirect } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { DashboardPageBack } from '@/features/dashboard/components/layout/dashboard-page-back';
import { getResearchJourney } from '@/features/profile/actions/get-research-journey';
import { ProfileView } from '@/features/profile/components';
import { buildMilestones } from '@/features/profile/lib/build-milestones';
import type { ProfilePreviewData } from '@/features/profile/types';
import { getProfile } from '@/features/settings/actions';

export default async function ProfilePreviewRoute() {
  const [profile, journey, t] = await Promise.all([
    getProfile(),
    getResearchJourney(),
    getTranslations(),
  ]);

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
    journey: journey ? buildMilestones(journey) : [],
  };

  return (
    <>
      <DashboardPageBack href={ROUTES.common.dashboard} label={t('common.dashboard')} />

      <PageTransition>
        <ProfileView profile={previewData} isPreview />
      </PageTransition>
    </>
  );
}
