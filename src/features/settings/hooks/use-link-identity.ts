'use client';

import { useState } from 'react';

import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import type { AuthProvider } from '@/features/auth/types';
import type { MessageKey } from '@/i18n/types';
import { env } from '@/lib/common/env';
import { createBrowserAuthProvider } from '@/lib/providers/client';

/** Initiate an OAuth identity link flow, tracking the in-progress provider. */
export function useLinkIdentity() {
  const t = useTranslations();
  const locale = useLocale();
  const [linkingProvider, setLinkingProvider] = useState<AuthProvider | null>(null);

  async function linkProvider(provider: AuthProvider) {
    setLinkingProvider(provider);

    try {
      const auth = createBrowserAuthProvider();

      const { error } = await auth.linkIdentity({
        provider,
        redirectTo: `${env.NEXT_PUBLIC_APP_URL}/${locale}/auth/callback?next=/${locale}/settings%23connected-accounts`,
      });

      if (error) {
        toast.error(t('settings.connectedAccounts.errors.linkFailed' as MessageKey));
        setLinkingProvider(null);
      }
    } catch {
      toast.error(t('settings.errors.unexpected' as MessageKey));
      setLinkingProvider(null);
    }
  }

  return { linkingProvider, linkProvider };
}
