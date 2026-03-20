import { redirect } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES, getPageMetadata } from '@/config';
import { getProfile } from '@/features/settings/actions';
import { PasswordForm } from '@/features/settings/components/password-form';

export async function generateMetadata() {
  const t = await getTranslations();

  return getPageMetadata(t, 'settingsPassword');
}

export default async function SettingsPasswordPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.auth.signIn);
  }

  return (
    <PageTransition>
      <PasswordForm hasPassword={profile.hasPassword} />
    </PageTransition>
  );
}
