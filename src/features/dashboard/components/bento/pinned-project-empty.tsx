'use client';

import { Pin } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { BENTO_CARD_CLASS } from '@/features/dashboard/components/bento/bento-styles';

export function PinnedProjectEmpty() {
  const t = useTranslations('dashboard.bento');

  return (
    <Card className={BENTO_CARD_CLASS}>
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {t('pinned.title')}
        </p>
        <Pin className="text-chart-violet size-4 shrink-0" />
      </div>
      <div className="flex h-full min-h-28 flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-muted-foreground text-sm font-medium">{t('pinned.empty')}</p>
        <p className="text-muted-foreground/80 max-w-xs text-xs">{t('pinned.emptyHint')}</p>
      </div>
    </Card>
  );
}
