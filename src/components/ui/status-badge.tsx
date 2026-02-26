'use client';

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

interface StatusBadgeProps {
  labelKey: string;
  descriptionKey: string;
  ariaLabelKey: string;
  variant: 'default' | 'secondary' | 'outline';
  badgeClassName?: string | undefined;
  showPulseDot?: boolean | undefined;
  className?: string | undefined;
}

export function StatusBadge({
  labelKey,
  descriptionKey,
  ariaLabelKey,
  variant,
  badgeClassName,
  showPulseDot = false,
  className,
}: StatusBadgeProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const label = t(labelKey as MessageKey);

  const badgeElement = (
    <Badge variant={variant} className={cn('text-[11px]', badgeClassName, className)}>
      {showPulseDot && (
        <span className="relative mr-0.5 flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
        </span>
      )}
      {label}
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
        aria-label={t(ariaLabelKey as MessageKey, { status: label })}
      >
        {badgeElement}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="sr-only">{label}</DialogTitle>

            <div className="flex flex-col items-start gap-3">
              {badgeElement}
              <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                {t(descriptionKey as MessageKey)}
              </DialogDescription>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
