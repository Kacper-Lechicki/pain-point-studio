import type { ReactNode } from 'react';

import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/common/utils';

interface SettingsSectionHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
  variant?: 'default' | 'destructive';
}

const SettingsSectionHeader = ({
  title,
  description,
  icon: Icon,
  action,
  variant = 'default',
}: SettingsSectionHeaderProps) => {
  const destructive = variant === 'destructive';

  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b pb-6',
        destructive ? 'border-destructive/20' : 'border-border/40'
      )}
    >
      <div className="space-y-1">
        <h2
          className={cn(
            'flex items-center gap-2 text-lg font-semibold',
            destructive && 'text-destructive'
          )}
        >
          {Icon && (
            <Icon
              className={cn(
                'size-5 shrink-0',
                destructive ? 'text-destructive' : 'text-muted-foreground'
              )}
              aria-hidden
            />
          )}
          {title}
        </h2>

        <p className={cn('text-xs', destructive ? 'text-destructive' : 'text-muted-foreground')}>
          {description}
        </p>
      </div>

      {action}
    </div>
  );
};

export { SettingsSectionHeader };
