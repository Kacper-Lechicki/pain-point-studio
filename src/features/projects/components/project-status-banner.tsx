import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/common/utils';

interface ProjectStatusBannerProps {
  icon: LucideIcon;
  colorClass: string;
  message: string;
  actionLabel?: string | undefined;
  onAction?: (() => void) | undefined;
}

export function ProjectStatusBanner({
  icon: Icon,
  colorClass,
  message,
  actionLabel,
  onAction,
}: ProjectStatusBannerProps) {
  return (
    <div className={cn('flex items-center gap-2 rounded-lg px-3 py-2', colorClass)}>
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="text-muted-foreground flex-1 text-sm">{message}</span>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
