'use client';

import { useTranslations } from 'next-intl';

import { OAuthButtons } from './oauth-buttons';

const OAuthSection = () => {
  const t = useTranslations();

  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>

        <div className="relative flex justify-center text-xs lowercase">
          <span className="bg-background text-muted-foreground rounded-full px-2 py-1">
            {t('auth.orContinueWith')}
          </span>
        </div>
      </div>

      <OAuthButtons />
    </>
  );
};

export { OAuthSection };
