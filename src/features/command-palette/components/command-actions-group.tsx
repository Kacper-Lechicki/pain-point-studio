'use client';

import { FlaskConical, FolderPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CommandGroup, CommandItem } from '@/components/ui/command';
import { ROUTES } from '@/config/routes';
import { useRouter } from '@/i18n/routing';

interface CommandActionsGroupProps {
  onClose: () => void;
  onCreateSurvey: () => void;
}

export function CommandActionsGroup({ onClose, onCreateSurvey }: CommandActionsGroupProps) {
  const t = useTranslations('commandPalette');
  const router = useRouter();

  return (
    <CommandGroup heading={t('groups.quickActions')}>
      <CommandItem
        value={t('actions.createProject')}
        onSelect={() => {
          onClose();
          router.push(ROUTES.dashboard.projectNew);
        }}
      >
        <FolderPlus />
        {t('actions.createProject')}
      </CommandItem>

      <CommandItem value={t('actions.createSurvey')} onSelect={onCreateSurvey}>
        <FlaskConical />
        {t('actions.createSurvey')}
      </CommandItem>
    </CommandGroup>
  );
}
