import { redirect } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES, getPageMetadata } from '@/config';
import { getProfile } from '@/features/settings/actions';
import { ConnectedAccounts } from '@/features/settings/components/connected-accounts';

export async function generateMetadata() {
  const t = await getTranslations();

  return getPageMetadata(t, 'settingsConnectedAccounts');
}

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
