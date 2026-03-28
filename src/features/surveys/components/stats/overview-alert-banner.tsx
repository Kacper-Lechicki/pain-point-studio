'use client';

import { useState } from 'react';

import { AlertTriangle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { OverviewAlert } from '@/features/surveys/lib/overview-alerts';
import type { MessageKey } from '@/i18n/types';

interface OverviewAlertBannerProps {
  alert: OverviewAlert;
}

export function OverviewAlertBanner({ alert }: OverviewAlertBannerProps) {
  const t = useTranslations();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800/40 dark:bg-amber-950/20">
      <AlertTriangle className="size-4 shrink-0 text-amber-500" aria-hidden />

      <p className="text-foreground/80 flex-1 text-sm font-medium">
        {t(alert.messageKey as MessageKey, alert.values)}
      </p>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-0.5 transition-colors"
        aria-label={t('common.close' as MessageKey)}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
