'use client';

import { useRouter } from 'next/navigation';

import { ArrowLeft, FolderKanban, FolderPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ROUTES } from '@/config/routes';
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import { getCreateSurveyUrl } from '@/features/surveys/lib/survey-urls';

interface CommandProjectPickerProps {
  projects: ProjectWithMetrics[];
  onBack: () => void;
  onClose: () => void;
}

export function CommandProjectPicker({ projects, onBack, onClose }: CommandProjectPickerProps) {
  const t = useTranslations('commandPalette');
  const router = useRouter();

  return (
    <Command>
      <div className="flex items-center gap-2 border-b px-3">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <ArrowLeft className="size-4" />
          <span className="sr-only">{t('projectPicker.back')}</span>
        </Button>
        <CommandInput placeholder={t('projectPicker.placeholder')} className="border-0" />
      </div>

      <CommandList>
        <CommandEmpty>{t('projectPicker.empty')}</CommandEmpty>

        {projects.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-muted-foreground mb-3 text-sm">{t('projectPicker.empty')}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                router.push(ROUTES.dashboard.projectNew);
              }}
            >
              <FolderPlus className="size-4" />
              {t('projectPicker.createFirst')}
            </Button>
          </div>
        ) : (
          <CommandGroup heading={t('projectPicker.title')}>
            {projects.map((project) => (
              <CommandItem
                key={project.id}
                value={project.name}
                onSelect={() => {
                  onClose();
                  router.push(getCreateSurveyUrl(project.id));
                }}
              >
                <FolderKanban />
                {project.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
