import { Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/common/utils';

interface SaveStatusIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  /** Add truncate to text labels (used in mobile layout) */
  truncate?: boolean;
  className?: string;
}

export function SaveStatusIndicator({
  status,
  truncate = false,
  className,
}: SaveStatusIndicatorProps) {
  const t = useTranslations();

  if (status === 'idle') {
    return null;
  }

  return (
    <div className={cn('text-muted-foreground flex items-center gap-1.5 text-xs', className)}>
      {status === 'saving' && (
        <>
          <Loader2 className="size-3 animate-spin" />
          <span className={cn(truncate && 'truncate')}>{t('surveys.builder.saving')}</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="size-3" />
          <span className={cn(truncate && 'truncate')}>{t('surveys.builder.saved')}</span>
        </>
      )}
      {status === 'error' && (
        <span className={cn('text-destructive', truncate && 'truncate')}>
          {t('surveys.builder.saveError')}
        </span>
      )}
    </div>
  );
}
