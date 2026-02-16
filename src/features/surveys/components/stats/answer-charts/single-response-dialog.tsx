'use client';

import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SingleResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionText: string;
  responseText: string;
}

export function SingleResponseDialog({
  open,
  onOpenChange,
  questionText,
  responseText,
}: SingleResponseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[80vh] gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogHeader className="border-b px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <DialogTitle className="min-w-0 flex-1 text-sm leading-snug font-semibold">
              {questionText || '—'}
            </DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="size-3.5" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
          <DialogDescription className="sr-only">Full response</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto px-5 py-4">
          <p className="text-foreground/90 text-[13px] leading-relaxed break-all whitespace-pre-wrap">
            {responseText}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
