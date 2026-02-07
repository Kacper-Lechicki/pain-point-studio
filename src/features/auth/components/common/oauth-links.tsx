'use client';

import { useTranslations } from 'next-intl';

import { ROUTES } from '@/config';
import { OAuthButtons } from '@/features/auth/components/common/oauth-buttons';
import { Link } from '@/i18n/routing';

interface OAuthLinksProps {
  mode?: 'signIn' | 'signUp';
}

const OAuthLinks = ({ mode = 'signIn' }: OAuthLinksProps) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
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
      </div>

      {mode === 'signIn' && (
        <div className="flex flex-col gap-2 px-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Link
            href={ROUTES.auth.signUp}
            className="hover:text-primary hover:bg-accent/50 rounded-md py-2 text-center underline transition-colors sm:p-0 sm:text-left sm:hover:bg-transparent"
          >
            {t('auth.dontHaveAccount')}
          </Link>

          <Link
            href={ROUTES.auth.forgotPassword}
            className="hover:text-primary hover:bg-accent/50 rounded-md py-2 text-center underline transition-colors sm:p-0 sm:text-right sm:hover:bg-transparent"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>
      )}

      {mode === 'signUp' && (
        <div className="flex justify-center px-1 text-sm">
          <Link
            href={ROUTES.auth.signIn}
            className="hover:text-primary hover:bg-accent/50 rounded-md py-2 text-center underline transition-colors sm:p-0 sm:hover:bg-transparent"
          >
            {t('auth.alreadyHaveAccount')}
          </Link>
        </div>
      )}
    </div>
  );
};

export { OAuthLinks };
