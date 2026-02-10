import { ReactNode } from 'react';

import { InfoHint } from '@/components/ui/info-hint';

interface SettingsSectionHeaderProps {
  title: string;
  description: string;
  hintContent?: string;
  hintDialogTitle?: string;
  action?: ReactNode;
  variant?: 'default' | 'destructive';
}

const SettingsSectionHeader = ({
  title,
  description,
  hintContent,
  hintDialogTitle,
  action,
  variant = 'default',
}: SettingsSectionHeaderProps) => {
  const borderClass = variant === 'destructive' ? 'border-destructive/20' : 'border-border/40';

  const titleClass =
    variant === 'destructive' ? 'text-destructive text-lg font-semibold' : 'text-lg font-semibold';

  const descriptionClass =
    variant === 'destructive' ? 'text-destructive text-sm' : 'text-muted-foreground text-sm';

  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-3 border-b pb-6 ${borderClass}`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className={titleClass}>{title}</h2>

          {hintContent && (
            <InfoHint
              content={hintContent}
              {...(hintDialogTitle && { dialogTitle: hintDialogTitle })}
            />
          )}
        </div>

        <p className={descriptionClass}>{description}</p>
      </div>

      {action}
    </div>
  );
};

export { SettingsSectionHeader };
