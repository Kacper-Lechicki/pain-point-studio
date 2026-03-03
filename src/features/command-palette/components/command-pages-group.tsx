'use client';

import { useTranslations } from 'next-intl';

import { CommandGroup, CommandItem } from '@/components/ui/command';
import { SEARCHABLE_PAGES } from '@/features/command-palette/config/searchable-pages';
import { useRouter } from '@/i18n/routing';

interface CommandPagesGroupProps {
  onClose: () => void;
}

export function CommandPagesGroup({ onClose }: CommandPagesGroupProps) {
  const t = useTranslations();
  const tPalette = useTranslations('commandPalette');
  const router = useRouter();

  return (
    <CommandGroup heading={tPalette('groups.pages')}>
      {SEARCHABLE_PAGES.map((page) => (
        <CommandItem
          key={page.id}
          value={`${t(page.labelKey)} ${page.keywords?.join(' ') ?? ''}`}
          onSelect={() => {
            onClose();
            router.push(page.href);
          }}
        >
          <page.icon />
          {t(page.labelKey)}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
