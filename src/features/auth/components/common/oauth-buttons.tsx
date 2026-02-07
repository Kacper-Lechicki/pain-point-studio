'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { signInWithOAuth } from '@/features/auth/actions';
import { OAuthButton } from '@/features/auth/components/common/oauth-button';
import { OAUTH_PROVIDERS, OAuthProviderConfig } from '@/features/auth/config';
import { AuthProvider } from '@/features/auth/types';

const OAuthButtons = () => {
  const t = useTranslations();
  const [loading, setLoading] = useState<AuthProvider | null>(null);

  const handleOAuthSignIn = async (provider: AuthProvider) => {
    setLoading(provider);

    const result = await signInWithOAuth(provider);

    if (result.error) {
      toast.error(t(result.error));
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {OAUTH_PROVIDERS.map((provider: OAuthProviderConfig) => (
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
