'use client';

import { useState } from 'react';

import { toast } from 'sonner';

import { signInWithOAuth } from '@/features/auth/actions';
import { OAuthButton } from '@/features/auth/components/oauth-button';
import { OAUTH_PROVIDERS, OAuthProviderConfig } from '@/features/auth/config/providers';
import { AuthProvider } from '@/features/auth/types';

export function OAuthButtons() {
  const [loading, setLoading] = useState<AuthProvider | null>(null);

  const handleOAuthSignIn = async (provider: AuthProvider) => {
    setLoading(provider);

    const result = await signInWithOAuth(provider);

    if (result.error) {
      toast.error(result.error);
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
}
