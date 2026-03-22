'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface ActivityInfoTriggerProps {
  /** Title of the dialog (e.g. "Last edited"). Shown as sr-only when dialogBadgeLabel is set. */
  titleKey: string;
  /** Description message key (can use ICU params). */
  descriptionKey: string;
  /** Params for the description message (e.g. { days: 30 }). */
  descriptionValues?: Record<string, string | number>;
  children: ReactNode;
  className?: string;
  /** Prevent click from bubbling to row (e.g. for table/card row select). */
  stopPropagation?: boolean;
  /** When set, dialog shows badge + description (same layout as StatusBadge). */
  dialogBadgeLabel?: ReactNode;
  /** Badge className in dialog (e.g. semantic color). Should match the trigger badge. */
  dialogBadgeClassName?: string;
}

export function ActivityInfoTrigger({
  titleKey,
  descriptionKey,
  descriptionValues,
  children,
  className,
  stopPropagation = true,
  dialogBadgeLabel,
  dialogBadgeClassName,
}: ActivityInfoTriggerProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }

    setOpen(true);
  };

  const useBadgeLayout = dialogBadgeLabel != null;

  return (
    <>
      <button
        type="button"
        className={cn(
          'focus-visible:ring-ring cursor-pointer rounded focus-visible:ring-2 focus-visible:outline-none',
          className
        )}
        onClick={handleClick}
        aria-label={t('surveys.dashboard.activityInfo.ariaLabel')}
      >
        {children}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={useBadgeLayout ? 'sr-only' : undefined}>
              {t(titleKey as MessageKey)}
            </DialogTitle>
            {useBadgeLayout ? (
              <div className="flex flex-col items-start gap-3">
                <Badge
                  variant="secondary"
                  className={cn(
                    'inline-flex items-center gap-1 text-[11px] font-medium',
                    dialogBadgeClassName
                  )}
                >
                  {dialogBadgeLabel}
                </Badge>
                <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                  {t(descriptionKey as MessageKey, descriptionValues ?? {})}
                </DialogDescription>
              </div>
            ) : (
              <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                {t(descriptionKey as MessageKey, descriptionValues ?? {})}
              </DialogDescription>
            )}
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
