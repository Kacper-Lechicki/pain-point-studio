import { redirect } from 'next/navigation';

import { SettingsPage } from '@/app/[locale]/(dashboard)/settings/_components/settings-page';
import { ROUTES } from '@/config';
import { getProfile } from '@/features/settings/actions';

export default async function SettingsRoute() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.auth.signIn);
  }

  return <SettingsPage profile={profile} />;
}
