'use client';

import { useEffect } from 'react';

import { useSearchParams } from 'next/navigation';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

const TOAST_KEYS = ['emailConfirmed', 'emailChangeConfirmed', 'passwordResetReady'] as const;
const ERROR_KEYS = ['linkExpired', 'callbackError', 'profileCreationFailed'] as const;

type ToastKey = (typeof TOAST_KEYS)[number];
type ErrorKey = (typeof ERROR_KEYS)[number];

function isValidToastKey(value: string): value is ToastKey {
  return (TOAST_KEYS as readonly string[]).includes(value);
}

function isValidErrorKey(value: string): value is ErrorKey {
  return (ERROR_KEYS as readonly string[]).includes(value);
}

const AuthToast = ({ showNoScriptFallback = false }: { showNoScriptFallback?: boolean }) => {
  const searchParams = useSearchParams();
  const t = useTranslations('auth');

  const errorKey = searchParams.get('error');

  useEffect(() => {
    const toastKey = searchParams.get('toast');

    if (toastKey && isValidToastKey(toastKey)) {
      toast.success(t(toastKey));
    } else if (errorKey && isValidErrorKey(errorKey)) {
      toast.error(t(`errors.${errorKey}`));
    } else {
      return;
    }

    window.history.replaceState(null, '', window.location.pathname);
  }, [searchParams, errorKey, t]);

  if (showNoScriptFallback && errorKey && isValidErrorKey(errorKey)) {
    return (
      <noscript>
        <div role="alert" className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {t(`errors.${errorKey}`)}
        </div>
      </noscript>
    );
  }

  return null;
};

export { AuthToast };
