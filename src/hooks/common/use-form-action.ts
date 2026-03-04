'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { ROUTES } from '@/config';
import { useRouter } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';
import { ActionResult, ERRORS } from '@/lib/common/types';

interface UseFormActionOptions<D = undefined> {
  successMessage?: MessageKey;
  unexpectedErrorMessage?: MessageKey;
  onSuccess?: (data?: D) => void;
  onError?: () => void;
}

export function useFormAction<D = undefined>(options: UseFormActionOptions<D> = {}) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    unexpectedErrorMessage = ERRORS.unexpected as MessageKey,
    successMessage,
    onSuccess,
    onError,
  } = options;

  const execute = async <T, R = D>(
    action: (data: T) => Promise<ActionResult<R>>,
    data: T
  ): Promise<ActionResult<R>> => {
    setIsLoading(true);

    try {
      const result = await action(data);

      if (result.error) {
        if (result.error === ERRORS.authRequired) {
          toast.error(t(ERRORS.authRequired as MessageKey));
          onError?.();
          router.replace(ROUTES.auth.signIn);
          router.refresh();

          return result;
        }

        toast.error(t(result.error as MessageKey));
        onError?.();

        return result;
      }

      if (successMessage) {
        toast.success(t(successMessage));
      }

      onSuccess?.(result.data as D | undefined);

      return result;
    } catch {
      toast.error(t(unexpectedErrorMessage));
      onError?.();

      return { error: unexpectedErrorMessage } as ActionResult<R>;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, execute };
}
