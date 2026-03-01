'use client';

import { useTranslations } from 'next-intl';

import { OAuthButtons } from '@/features/auth/components/common/oauth-buttons';

const OAuthLinks = () => {
  const t = useTranslations('auth');

  return (
    <div className="space-y-4">
      <div className="relative py-1.5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>

        <div className="relative flex justify-center text-xs lowercase">
          <span className="border-border/60 bg-background text-muted-foreground rounded-md border px-3 py-1">
            {t('orContinueWith')}
          </span>
        </div>
      </div>

      <OAuthButtons />
    </div>
  );
};

export { OAuthLinks };
