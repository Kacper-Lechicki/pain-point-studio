'use client';

import { useState } from 'react';

import { Info } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';

interface InfoHintProps {
  content: string;
  dialogTitle?: string;
}

const InfoHint = ({ content, dialogTitle = 'Info' }: InfoHintProps) => {
  const isDesktop = useBreakpoint('md');
  const [isOpen, setIsOpen] = useState(false);

  if (isDesktop) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground md:hover:text-foreground transition-colors"
            >
              <Info className="size-4" />
              <span className="sr-only">{content}</span>
            </button>
          </TooltipTrigger>

          <TooltipContent side="bottom" align="start" collisionPadding={16} className="max-w-72">
            <p>{content}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-muted-foreground md:hover:text-foreground transition-colors"
      >
        <Info className="size-4" />
        <span className="sr-only">{content}</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader className="text-left">
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{content}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { InfoHint };
