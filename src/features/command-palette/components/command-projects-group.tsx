'use client';

import { useRouter } from 'next/navigation';

import { FolderKanban } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CommandGroup, CommandItem } from '@/components/ui/command';
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';

interface CommandProjectsGroupProps {
  projects: ProjectWithMetrics[];
  onClose: () => void;
}

export function CommandProjectsGroup({ projects, onClose }: CommandProjectsGroupProps) {
  const t = useTranslations('commandPalette');
  const router = useRouter();

  if (projects.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading={t('groups.projects')}>
      {projects.map((project) => (
        <CommandItem
          key={project.id}
          value={project.name}
          onSelect={() => {
            onClose();
            router.push(getProjectDetailUrl(project.id));
          }}
        >
          <FolderKanban />
          {project.name}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
