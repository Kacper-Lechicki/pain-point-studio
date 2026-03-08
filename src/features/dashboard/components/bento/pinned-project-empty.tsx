'use client';

import { Pin } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  BENTO_CARD_CLASS,
  BENTO_EMPTY_STATE_MIN_H,
  BENTO_ROW4_CARD_MIN_H,
} from '@/features/dashboard/components/bento/bento-styles';
import { cn } from '@/lib/common/utils';

export function PinnedProjectEmpty() {
  const t = useTranslations('dashboard.bento');

  return (
    <Card className={cn(BENTO_CARD_CLASS, BENTO_ROW4_CARD_MIN_H, 'flex h-full flex-col')}>
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-4 pb-0">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {t('pinned.title')}
        </p>
        <Pin className="text-chart-violet size-4 shrink-0" />
      </div>
      <EmptyState
        variant="card"
        accent="violet"
        icon={Pin}
        title={t('pinned.empty')}
        description={t('pinned.emptyHint')}
        className={cn('flex-1 justify-center', BENTO_EMPTY_STATE_MIN_H)}
      />
    </Card>
  );
}
