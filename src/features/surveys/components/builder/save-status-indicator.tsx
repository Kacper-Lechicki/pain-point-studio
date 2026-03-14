'use client';

import { Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/common/utils';

interface SaveStatusIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  isDirty: boolean;
  truncate?: boolean;
  className?: string;
}

export function SaveStatusIndicator({
  status,
  isDirty,
  truncate = false,
  className,
}: SaveStatusIndicatorProps) {
  const t = useTranslations('surveys.builder');

  const showSaved = status === 'saved' || (status === 'idle' && !isDirty);

  if (status === 'idle' && isDirty) {
    return null;
  }

  return (
    <div className={cn('text-muted-foreground flex items-center gap-1.5 text-xs', className)}>
      {status === 'saving' && (
        <>
          <Loader2 className="size-3 animate-spin" />
          <span className={cn(truncate && 'truncate')}>{t('saving')}</span>
        </>
      )}

      {showSaved && (
        <>
          <Check className="size-3" />
          <span className={cn(truncate && 'truncate')}>{t('saved')}</span>
        </>
      )}

      {status === 'error' && (
        <span className={cn('text-destructive', truncate && 'truncate')}>{t('saveError')}</span>
      )}
    </div>
  );
}
