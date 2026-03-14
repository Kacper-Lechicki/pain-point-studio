'use client';

import { useState } from 'react';

import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import type { MessageKey } from '@/i18n/types';
import type { AuthProvider } from '@/lib/common/auth-provider';
import { env } from '@/lib/common/env';
import { createClient } from '@/lib/supabase/client';

/** Initiate an OAuth identity link flow, tracking the in-progress provider. */
export function useLinkIdentity() {
  const t = useTranslations();
  const locale = useLocale();
  const [linkingProvider, setLinkingProvider] = useState<AuthProvider | null>(null);

  async function linkProvider(provider: AuthProvider) {
    setLinkingProvider(provider);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: `${env.NEXT_PUBLIC_APP_URL}/${locale}/auth/callback?next=/${locale}/settings/connected-accounts`,
        },
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
