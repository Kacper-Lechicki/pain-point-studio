import { redirect } from 'next/navigation';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { getProfile } from '@/features/settings/actions';
import { ConnectedAccounts } from '@/features/settings/components/connected-accounts';

export const dynamic = 'force-dynamic';

export default async function SettingsConnectedAccountsPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.auth.signIn);
  }

  return (
    <PageTransition>
      <ConnectedAccounts identities={profile.identities} hasPassword={profile.hasPassword} />
    </PageTransition>
  );
}
