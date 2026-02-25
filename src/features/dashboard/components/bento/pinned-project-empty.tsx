'use client';

import { Pin } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { BENTO_CARD_CLASS } from '@/features/dashboard/components/bento/bento-styles';
import { cn } from '@/lib/common/utils';

export function PinnedProjectEmpty() {
  const t = useTranslations('dashboard.bento');

  return (
    <Card className={cn(BENTO_CARD_CLASS, 'flex min-h-40 flex-col')}>
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-4 pb-0">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {t('pinned.title')}
        </p>
        <Pin className="text-chart-violet size-4 shrink-0" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4 py-6 text-center">
        <p className="text-muted-foreground text-sm font-medium">{t('pinned.empty')}</p>
        <p className="text-muted-foreground/80 max-w-xs text-xs">{t('pinned.emptyHint')}</p>
      </div>
    </Card>
  );
}
