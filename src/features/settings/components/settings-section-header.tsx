import type { ReactNode } from 'react';

import { cn } from '@/lib/common/utils';

interface SettingsSectionHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
  variant?: 'default' | 'destructive';
}

const SettingsSectionHeader = ({
  title,
  description,
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
        <h2 className={cn('text-lg font-semibold', destructive && 'text-destructive')}>{title}</h2>

        <p className={cn('text-xs', destructive ? 'text-destructive' : 'text-muted-foreground')}>
          {description}
        </p>
      </div>

      {action}
    </div>
  );
};

export { SettingsSectionHeader };
