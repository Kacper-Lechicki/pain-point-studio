'use client';

import { useState } from 'react';

import { XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog as DialogPrimitive } from 'radix-ui';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getStatusBadgeProps } from '@/features/surveys/config/survey-status';
import type { SurveyStatus } from '@/features/surveys/types';
import { cn } from '@/lib/common/utils';

interface SurveyStatusBadgeProps {
  status: SurveyStatus;
  className?: string;
}

export function SurveyStatusBadge({ status, className }: SurveyStatusBadgeProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const { variant, className: badgeClass, showPulseDot } = getStatusBadgeProps(status);

  const badgeElement = (
    <Badge variant={variant} className={cn('text-[11px]', badgeClass, className)}>
      {showPulseDot && (
        <span className="relative mr-0.5 flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
        </span>
      )}
      {t(`surveys.dashboard.status.${status}`)}
    </Badge>
  );

  return (
    <>
      <button
        type="button"
        className="cursor-pointer focus-visible:outline-none"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={t('surveys.dashboard.statusInfo.ariaLabel', {
          status: t(`surveys.dashboard.status.${status}`),
        })}
      >
        {badgeElement}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xs" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="sr-only">{t(`surveys.dashboard.status.${status}`)}</DialogTitle>
            <div className="flex flex-col items-start gap-3">
              {badgeElement}
              <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                {t(`surveys.dashboard.statusInfo.${status}`)}
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogPrimitive.Close
            className={cn(
              'inline-flex items-center justify-center rounded-md transition-all outline-none disabled:pointer-events-none',
              'text-muted-foreground border border-transparent',
              'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
              'md:hover:border-foreground/30 md:hover:text-foreground md:hover:border-dashed',
              "absolute top-4 right-4 size-6 [&_svg:not([class*='size-'])]:size-3"
            )}
          >
            <XIcon className="size-4" aria-hidden />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogContent>
      </Dialog>
    </>
  );
}
