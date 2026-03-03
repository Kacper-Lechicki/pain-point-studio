'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useIsMac } from '@/features/command-palette/hooks/use-is-mac';

interface CommandPaletteTriggerProps {
  onOpen: () => void;
}

export function CommandPaletteTrigger({ onOpen }: CommandPaletteTriggerProps) {
  const t = useTranslations('commandPalette');
  const isMac = useIsMac();

  return (
    <>
      {/* Desktop: compact search bar */}
      <button
        type="button"
        onClick={onOpen}
        className="border-input bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hidden h-[30px] w-48 items-center gap-1.5 rounded-md border px-2 text-xs transition-colors md:flex"
        aria-label={t('trigger.shortcut')}
      >
        <Search className="size-3.5 shrink-0" />
        <span className="flex-1 text-left">{t('trigger.placeholder')}</span>
        <kbd className="bg-background text-muted-foreground pointer-events-none inline-flex h-[18px] items-center rounded border px-1 font-sans text-[10px] leading-none font-medium tracking-tight select-none">
          {isMac ? '⌘' : 'Ctrl '}K
        </kbd>
      </button>

      {/* Mobile: icon button */}
      <button
        type="button"
        onClick={onOpen}
        className="text-muted-foreground hover:text-foreground flex size-[30px] items-center justify-center rounded-md transition-colors md:hidden"
        aria-label={t('trigger.shortcut')}
      >
        <Search className="size-4" />
      </button>
    </>
  );
}
