import { redirect } from 'next/navigation';

import { SettingsPage } from '@/app/[locale]/(dashboard)/(main)/settings/_components/settings-page';
import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { getProfile } from '@/features/settings/actions';

export default async function SettingsRoute() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.auth.signIn);
  }

  return (
    <PageTransition>
      <SettingsPage profile={profile} />
    </PageTransition>
  );
}
