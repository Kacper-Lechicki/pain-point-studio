'use client';

import { useEffect } from 'react';

import { useSearchParams } from 'next/navigation';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

const TOAST_KEYS = ['signInSuccess', 'emailConfirmed', 'emailChangeConfirmed'] as const;

type ToastKey = (typeof TOAST_KEYS)[number];

function isValidToastKey(value: string): value is ToastKey {
  return (TOAST_KEYS as readonly string[]).includes(value);
}

const AuthToast = () => {
  const searchParams = useSearchParams();
  const t = useTranslations('auth');

  useEffect(() => {
    const toastKey = searchParams.get('toast');

    if (toastKey && isValidToastKey(toastKey)) {
      toast.success(t(toastKey));

      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [searchParams, t]);

  return null;
};

export { AuthToast };
