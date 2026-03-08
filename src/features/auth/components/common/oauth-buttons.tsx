'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { signInWithOAuth } from '@/features/auth/actions';
import { OAuthButton } from '@/features/auth/components/common/oauth-button';
import { OAUTH_PROVIDERS } from '@/features/auth/config';
import { AuthProvider } from '@/features/auth/types';
import type { MessageKey } from '@/i18n/types';

const OAuthButtons = () => {
  const t = useTranslations();
  const [loading, setLoading] = useState<AuthProvider | null>(null);

  const handleOAuthSignIn = async (provider: AuthProvider) => {
    setLoading(provider);

    try {
      const result = await signInWithOAuth(provider);

      if (result.url) {
        window.location.href = result.url;

        return;
      }

      if (result.error) {
        toast.error(t(result.error as MessageKey));
      }
    } catch {
      toast.error(t('auth.errors.unexpected' as MessageKey));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {OAUTH_PROVIDERS.map((provider) => (
        <OAuthButton
          key={provider.id}
          provider={provider}
          isLoading={loading === provider.id}
          disabled={loading !== null}
          onClick={handleOAuthSignIn}
        />
      ))}
    </div>
  );
};

export { OAuthButtons };
