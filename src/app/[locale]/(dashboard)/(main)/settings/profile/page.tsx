import { redirect } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { getProfile } from '@/features/settings/actions';
import { ProfileForm } from '@/features/settings/components/profile-form';

export async function generateMetadata() {
  const t = await getTranslations();

  return { title: `${t('metadata.pages.settingsProfile')} | ${t('metadata.title')}` };
}

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
