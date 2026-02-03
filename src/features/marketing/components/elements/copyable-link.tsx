'use client';

import { useState } from 'react';

import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

interface CopyableLinkProps {
  link: string;
}

export const CopyableLink = ({ link }: CopyableLinkProps) => {
  const t = useTranslations('marketing.components.copyableLink');
  const label = t('label');
  const copyLabel = t('copy');
  const copiedLabel = t('copied');

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="bg-card text-card-foreground mt-6 rounded-lg border p-4 text-left shadow-sm">
      <label className="text-muted-foreground mb-2 block text-xs font-semibold tracking-wider uppercase">
        {label}
      </label>

      <div className="flex items-center gap-2">
        <div className="bg-muted text-muted-foreground min-w-0 flex-1 truncate rounded-md border px-3 py-2 text-sm">
          {link}
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={handleCopy}
            aria-label={copied ? copiedLabel : copyLabel}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>

          {copied && (
            <div className="border-border/50 bg-background animate-in fade-in slide-in-from-bottom-1 pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 rounded-lg border px-2.5 py-1.5 text-xs whitespace-nowrap shadow-xl">
              {copiedLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
