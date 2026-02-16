'use client';

import { useCallback, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

/**
 * Wraps `router.refresh()` with a pending state and a success toast.
 * The returned `isRefreshing` flag can drive a spin animation on an icon.
 */
export function useRefresh() {
  const router = useRouter();
  const t = useTranslations();
  const [isRefreshing, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
      toast.success(t('common.dataRefreshed'));
    });
  }, [router, startTransition, t]);

  return { isRefreshing, refresh } as const;
}
