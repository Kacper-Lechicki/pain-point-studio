'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config';
import { Link } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';

interface AuthSuccessMessageProps {
  messageKey: MessageKey;
}

const AuthSuccessMessage = ({ messageKey }: AuthSuccessMessageProps) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t('auth.checkEmail')}</h1>

      <p className="text-muted-foreground text-xs">{t(messageKey)}</p>

      <div className="pt-2">
        <Link href={ROUTES.auth.signIn}>
          <Button variant="outline" className="w-full">
            {t('auth.backToSignIn')}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export { AuthSuccessMessage };
