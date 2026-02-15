import type { ReactNode } from 'react';

import { InfoHint } from '@/components/ui/info-hint';
import { cn } from '@/lib/common/utils';

interface SettingsSectionHeaderProps {
  title: string;
  description: string;
  hintContent?: string;
  hintDialogTitle?: string;
  action?: ReactNode;
  variant?: 'default' | 'destructive';
}

const isDestructive = (variant: string) => variant === 'destructive';

const SettingsSectionHeader = ({
  title,
  description,
  hintContent,
  hintDialogTitle,
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
        <div className="flex items-center gap-2">
          <h2 className={cn('text-lg font-semibold', isDestructive(variant) && 'text-destructive')}>
            {title}
          </h2>

          {hintContent && (
            <InfoHint
              content={hintContent}
              {...(hintDialogTitle && { dialogTitle: hintDialogTitle })}
            />
          )}
        </div>

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
