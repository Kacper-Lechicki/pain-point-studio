'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import type { MessageKey } from '@/i18n/types';
import { ActionResult } from '@/lib/common/types';

interface UseFormActionOptions {
  successMessage?: MessageKey;
  unexpectedErrorMessage?: MessageKey;
  onSuccess?: () => void;
  onError?: () => void;
}

export function useFormAction(options: UseFormActionOptions = {}) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  const {
    unexpectedErrorMessage = 'auth.unexpectedError' as MessageKey,
    successMessage,
    onSuccess,
    onError,
  } = options;

  async function execute<T>(action: (data: T) => Promise<ActionResult>, data: T) {
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

        onSuccess?.();
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
