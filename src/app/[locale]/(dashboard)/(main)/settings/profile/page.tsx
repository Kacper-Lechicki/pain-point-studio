import { redirect } from 'next/navigation';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { getProfile } from '@/features/settings/actions';
import { ProfileForm } from '@/features/settings/components/profile-form';

export default async function SettingsProfilePage() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.auth.signIn);
  }

  return (
    <PageTransition>
      <ProfileForm profile={profile} />
    </PageTransition>
  );
}
