'use client';

import { useEffect, useState } from 'react';

import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { SYNC_ELAPSED_TICK_MS } from '@/features/surveys/config';
import { formatElapsed } from '@/lib/common/format-elapsed';
import { cn } from '@/lib/common/utils';

interface RefreshRealtimeButtonProps {
  isRefreshing: boolean;
  isRealtimeConnected: boolean;
  onRefresh: () => void;
  ariaLabel: string;
  lastSyncedAt?: number | undefined;
}

export function RefreshRealtimeButton({
  isRefreshing,
  isRealtimeConnected,
  onRefresh,
  ariaLabel,
  lastSyncedAt,
}: RefreshRealtimeButtonProps) {
  const t = useTranslations('common.sync');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (lastSyncedAt == null) {
      return;
    }

    queueMicrotask(() => setNow(Date.now()));

    const id = setInterval(() => setNow(Date.now()), SYNC_ELAPSED_TICK_MS);

    return () => clearInterval(id);
  }, [lastSyncedAt]);

  const elapsed = lastSyncedAt != null ? formatElapsed(now - lastSyncedAt, t) : null;

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label={ariaLabel}
          title={ariaLabel}
        >
          <RefreshCw className={cn('size-3', isRefreshing && 'animate-spin')} aria-hidden />
        </Button>

        <span
          className={cn(
            'absolute -top-px -right-px size-1.5 rounded-full',
            isRealtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'
          )}
          aria-hidden
        />
      </div>

      {elapsed && (
        <span className="text-muted-foreground hidden text-[11px] tabular-nums sm:inline">
          {elapsed}
        </span>
      )}
    </div>
  );
}
