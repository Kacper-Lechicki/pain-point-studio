import { redirect } from 'next/navigation';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { getProfile } from '@/features/settings/actions';
import { AppearanceSection } from '@/features/settings/components/appearance-section';

export default async function SettingsAppearancePage() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.auth.signIn);
  }

  return (
    <PageTransition>
      <AppearanceSection />
    </PageTransition>
  );
}
