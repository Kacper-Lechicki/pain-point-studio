'use client';

import { useRouter } from 'next/navigation';

import { NotebookPen } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CommandGroup, CommandItem } from '@/components/ui/command';
import type { UserSurvey } from '@/features/surveys/types';
import { getSurveyStatsUrl } from '@/lib/common/urls/survey-urls';

interface CommandSurveysGroupProps {
  surveys: UserSurvey[];
  onClose: () => void;
}

export function CommandSurveysGroup({ surveys, onClose }: CommandSurveysGroupProps) {
  const t = useTranslations('commandPalette');
  const router = useRouter();

  if (surveys.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading={t('groups.surveys')}>
      {surveys.map((survey) => (
        <CommandItem
          key={survey.id}
          value={`${survey.title} ${survey.projectName}`}
          onSelect={() => {
            onClose();
            router.push(getSurveyStatsUrl(survey.id));
          }}
        >
          <NotebookPen />
          <div className="min-w-0 flex-1">
            <span className="truncate">{survey.title}</span>
            <span className="text-muted-foreground ml-2 text-xs">{survey.projectName}</span>
          </div>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
