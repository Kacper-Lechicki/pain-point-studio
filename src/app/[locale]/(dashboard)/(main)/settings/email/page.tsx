import { redirect } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES, getPageMetadata } from '@/config';
import { getProfile } from '@/features/settings/actions';
import { EmailForm } from '@/features/settings/components/email-form';

export async function generateMetadata() {
  const t = await getTranslations();

  return getPageMetadata(t, 'settingsEmail');
}

export default async function SettingsEmailPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.auth.signIn);
  }

  return (
    <PageTransition>
      <EmailForm
        currentEmail={profile.email}
        pendingEmail={profile.pendingEmail}
        emailChangeConfirmStatus={profile.emailChangeConfirmStatus}
      />
    </PageTransition>
  );
}
