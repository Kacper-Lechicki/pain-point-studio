'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import { useTranslations } from 'next-intl';

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
  /** Title of the dialog (e.g. "Last edited"). */
  titleKey: string;
  /** Description message key (can use ICU params). */
  descriptionKey: string;
  /** Params for the description message (e.g. { days: 30 }). */
  descriptionValues?: Record<string, string | number>;
  children: ReactNode;
  className?: string;
  /** Prevent click from bubbling to row (e.g. for table/card row select). */
  stopPropagation?: boolean;
}

export function ActivityInfoTrigger({
  titleKey,
  descriptionKey,
  descriptionValues,
  children,
  className,
  stopPropagation = true,
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t(titleKey as MessageKey)}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
              {t(descriptionKey as MessageKey, descriptionValues ?? {})}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
