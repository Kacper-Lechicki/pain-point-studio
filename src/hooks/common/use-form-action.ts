'use client';

import { useCallback, useState } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import type { MessageKey } from '@/i18n/types';
import { ActionResult } from '@/lib/common/types';

interface UseFormActionOptions<D = undefined> {
  successMessage?: MessageKey;
  unexpectedErrorMessage?: MessageKey;
  onSuccess?: (data?: D) => void;
  onError?: () => void;
}

export function useFormAction<D = undefined>(options: UseFormActionOptions<D> = {}) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  const {
    unexpectedErrorMessage = 'auth.unexpectedError' as MessageKey,
    successMessage,
    onSuccess,
    onError,
  } = options;

  const execute = useCallback(
    async <T, R = D>(
      action: (data: T) => Promise<ActionResult<R>>,
      data: T
    ): Promise<ActionResult<R>> => {
      setIsLoading(true);

      try {
        const result = await action(data);

        if (result.error) {
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
    },
    [t, successMessage, unexpectedErrorMessage, onSuccess, onError]
  );

  return { isLoading, execute };
}
