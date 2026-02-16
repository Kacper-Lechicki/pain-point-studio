import { redirect } from 'next/navigation';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { getProfile } from '@/features/settings/actions';
import { DangerZone } from '@/features/settings/components/danger-zone';

export default async function SettingsDangerZonePage() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.auth.signIn);
  }

  return (
    <PageTransition>
      <DangerZone userEmail={profile.email} />
    </PageTransition>
  );
}
