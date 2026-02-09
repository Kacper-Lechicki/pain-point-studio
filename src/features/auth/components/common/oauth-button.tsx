'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { OAuthProviderConfig } from '@/features/auth/config';
import { cn } from '@/lib/common/utils';

interface OAuthButtonProps {
  provider: OAuthProviderConfig;
  isLoading: boolean;
  disabled: boolean;
  onClick: (providerId: OAuthProviderConfig['id']) => void;
}

const OAuthButton = ({ provider, isLoading, disabled, onClick }: OAuthButtonProps) => {
  const t = useTranslations();
  const Icon = provider.icon;

  const isGoogle = provider.id === 'google';
  const isGithub = provider.id === 'github';

  return (
    <Button
      onClick={() => onClick(provider.id)}
      disabled={disabled}
      variant={isGoogle ? 'outline' : 'default'}
      className={cn(
        'flex w-full items-center justify-center transition-all duration-200 md:hover:shadow-md',
        isGithub &&
          'border-[#24292e] bg-[#24292e] text-white md:hover:bg-[#1b1f23] md:hover:text-white',
        isGoogle &&
          'border-gray-300 bg-white text-gray-700 md:hover:bg-gray-50 md:hover:text-gray-700 dark:bg-white dark:text-gray-700 dark:md:hover:bg-gray-50 dark:md:hover:text-gray-700'
      )}
    >
      {isLoading ? <Spinner /> : <Icon className={cn('size-4', !isGoogle && 'fill-current')} />}
      {t(provider.label)}
    </Button>
  );
};

export { OAuthButton };
