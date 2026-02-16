'use client';

import type { ReactNode } from 'react';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface ResponsivePanelProps {
  isDesktop: boolean;
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  side: 'left' | 'right';
  title: string;
  desktopClassName: string;
  children: ReactNode;
}

export function ResponsivePanel({
  isDesktop,
  open,
  onOpenChange,
  side,
  title,
  desktopClassName,
  children,
}: ResponsivePanelProps) {
  if (isDesktop) {
    return <div className={desktopClassName}>{children}</div>;
  }

  return (
    <Sheet open={open ?? false} onOpenChange={onOpenChange ?? (() => {})}>
      <SheetContent
        side={side}
        className="flex w-72 flex-col p-0"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <SheetHeader className="border-border border-b px-4 py-2">
          <SheetTitle className="text-sm font-medium">{title}</SheetTitle>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
