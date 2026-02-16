import { redirect } from 'next/navigation';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { getProfile } from '@/features/settings/actions';
import { PasswordForm } from '@/features/settings/components/password-form';

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
