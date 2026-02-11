'use client';

import { useState } from 'react';

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

  async function execute<T, R = D>(action: (data: T) => Promise<ActionResult<R>>, data: T) {
    setIsLoading(true);

    try {
      const result = await action(data);

      if (result.error) {
        toast.error(t(result.error as MessageKey));
        onError?.();
        setIsLoading(false);
      } else {
        if (successMessage) {
          toast.success(t(successMessage));
        }

        onSuccess?.(result.data as D | undefined);
        setIsLoading(false);
      }

      return result;
    } catch {
      toast.error(t(unexpectedErrorMessage));
      onError?.();
      setIsLoading(false);

      return { error: unexpectedErrorMessage } as ActionResult;
    }
  }

  return { isLoading, execute };
}
