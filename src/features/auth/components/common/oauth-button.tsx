'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { OAuthProviderConfig } from '@/features/auth/config';

interface OAuthButtonProps {
  provider: OAuthProviderConfig;
  isLoading: boolean;
  disabled: boolean;
  onClick: (providerId: OAuthProviderConfig['id']) => void;
}

const OAuthButton = ({ provider, isLoading, disabled, onClick }: OAuthButtonProps) => {
  const t = useTranslations();
  const Icon = provider.icon;

  return (
    <Button onClick={() => onClick(provider.id)} disabled={disabled} className="w-full">
      {isLoading ? <Spinner /> : <Icon className="mr-2 size-4" />}
      {t(provider.label)}
    </Button>
  );
};

export { OAuthButton };
