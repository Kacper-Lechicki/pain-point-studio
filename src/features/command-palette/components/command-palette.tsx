'use client';

import { useCallback, useState } from 'react';

import { useTranslations } from 'next-intl';

import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
  CommandLoading,
} from '@/components/ui/command';
import { CommandActionsGroup } from '@/features/command-palette/components/command-actions-group';
import { CommandPagesGroup } from '@/features/command-palette/components/command-pages-group';
import { CommandProjectPicker } from '@/features/command-palette/components/command-project-picker';
import { CommandProjectsGroup } from '@/features/command-palette/components/command-projects-group';
import { CommandSurveysGroup } from '@/features/command-palette/components/command-surveys-group';
import { useCommandPaletteData } from '@/features/command-palette/hooks/use-command-palette-data';

type View = 'search' | 'pick-project';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const t = useTranslations('commandPalette');
  const [view, setView] = useState<View>('search');
  const { projects, surveys, loading } = useCommandPaletteData(open);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      onOpenChange(value);

      if (!value) {
        setView('search');
      }
    },
    [onOpenChange]
  );

  const handleClose = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  const handleCreateSurvey = useCallback(() => {
    setView('pick-project');
  }, []);

  const handleBackToSearch = useCallback(() => {
    setView('search');
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      {view === 'pick-project' ? (
        <CommandProjectPicker
          projects={projects ?? []}
          onBack={handleBackToSearch}
          onClose={handleClose}
        />
      ) : (
        <>
          <CommandInput placeholder={t('placeholder')} />

          <CommandList>
            {loading ? (
              <CommandLoading>{t('loading')}</CommandLoading>
            ) : (
              <>
                <CommandEmpty>{t('noResults')}</CommandEmpty>

                <CommandActionsGroup onClose={handleClose} onCreateSurvey={handleCreateSurvey} />

                <CommandPagesGroup onClose={handleClose} />

                {projects && projects.length > 0 && (
                  <CommandProjectsGroup projects={projects} onClose={handleClose} />
                )}

                {surveys && surveys.length > 0 && (
                  <CommandSurveysGroup surveys={surveys} onClose={handleClose} />
                )}
              </>
            )}
          </CommandList>
        </>
      )}
    </CommandDialog>
  );
}
