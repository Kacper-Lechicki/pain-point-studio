'use client';

import * as React from 'react';

import { Check, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/common/utils';

interface ClipboardInputProps extends React.ComponentProps<typeof Input> {
  value: string;
  copyLabel?: string;
  copiedLabel?: string;
}

const ClipboardInput = React.forwardRef<HTMLInputElement, ClipboardInputProps>(
  ({ className, value, copyLabel = 'Copy', copiedLabel = 'Copied', ...props }, ref) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    };

    return (
      <div className="relative flex items-center gap-2">
        <Input
          ref={ref}
          value={value}
          readOnly
          className={cn('bg-muted text-muted-foreground pr-10', className)}
          {...props}
        />

        <div className="absolute top-0 right-0 h-full">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-full px-3 hover:bg-transparent"
            onClick={handleCopy}
            aria-label={copied ? copiedLabel : copyLabel}
          >
            {copied ? (
              <Check className="size-4 text-green-500" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}
          </Button>

          {copied && (
            <div className="bg-popover text-popover-foreground animate-in fade-in slide-in-from-bottom-1 pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 rounded-md border px-2 py-1 text-xs shadow-md">
              {copiedLabel}
            </div>
          )}
        </div>
      </div>
    );
  }
);

ClipboardInput.displayName = 'ClipboardInput';

export { ClipboardInput };
