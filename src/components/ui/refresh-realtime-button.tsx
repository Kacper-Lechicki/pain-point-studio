import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/common/utils';

interface RefreshRealtimeButtonProps {
  isRefreshing: boolean;
  isRealtimeConnected: boolean;
  onRefresh: () => void;
  ariaLabel: string;
}

export function RefreshRealtimeButton({
  isRefreshing,
  isRealtimeConnected,
  onRefresh,
  ariaLabel,
}: RefreshRealtimeButtonProps) {
  return (
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
  );
}
