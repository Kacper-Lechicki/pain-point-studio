import type { ReactNode } from 'react';

import { cn } from '@/lib/common/utils';

interface SettingsSectionHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
  variant?: 'default' | 'destructive';
}

const isDestructive = (variant: string) => variant === 'destructive';

const SettingsSectionHeader = ({
  title,
  description,
  action,
  variant = 'default',
}: SettingsSectionHeaderProps) => {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b pb-6',
        isDestructive(variant) ? 'border-destructive/20' : 'border-border/40'
      )}
    >
      <div className="space-y-1">
        <h2 className={cn('text-lg font-semibold', isDestructive(variant) && 'text-destructive')}>
          {title}
        </h2>

        <p
          className={cn(
            'text-xs',
            isDestructive(variant) ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {description}
        </p>
      </div>

      {action}
    </div>
  );
};

export { SettingsSectionHeader };
