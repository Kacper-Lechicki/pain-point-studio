'use client';

import {
  Dialog,
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
      <DialogContent className="max-h-[80vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-5 pt-5 pb-4">
          <DialogTitle className="text-sm leading-snug font-semibold">
            {questionText || '—'}
          </DialogTitle>

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
