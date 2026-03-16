'use client';

import { useRouter } from 'next/navigation';

import { FolderKanban } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CommandGroup, CommandItem } from '@/components/ui/command';
import { useRecentItems } from '@/hooks/common/use-recent-items';
import { getProjectDetailUrl } from '@/lib/common/urls/project-urls';

interface CommandRecentProjectsGroupProps {
  onClose: () => void;
}

export function CommandRecentProjectsGroup({ onClose }: CommandRecentProjectsGroupProps) {
  const t = useTranslations('commandPalette');
  const router = useRouter();
  const { items } = useRecentItems('project');

  if (items.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading={t('groups.recentProjects')}>
      {items.map((item) => (
        <CommandItem
          key={item.id}
          value={`recent-project:${item.label}`}
          onSelect={() => {
            onClose();
            router.push(getProjectDetailUrl(item.id));
          }}
        >
          <FolderKanban />
          {item.label}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
