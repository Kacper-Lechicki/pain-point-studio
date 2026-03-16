'use client';

import { useRouter } from 'next/navigation';

import { NotebookPen } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CommandGroup, CommandItem } from '@/components/ui/command';
import { useRecentItems } from '@/hooks/common/use-recent-items';
import { getSurveyStatsUrl } from '@/lib/common/urls/survey-urls';

interface CommandRecentSurveysGroupProps {
  onClose: () => void;
}

export function CommandRecentSurveysGroup({ onClose }: CommandRecentSurveysGroupProps) {
  const t = useTranslations('commandPalette');
  const router = useRouter();
  const { items } = useRecentItems('survey');

  if (items.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading={t('groups.recentSurveys')}>
      {items.map((item) => (
        <CommandItem
          key={item.id}
          value={`recent-survey:${item.label}`}
          onSelect={() => {
            onClose();
            router.push(getSurveyStatsUrl(item.id));
          }}
        >
          <NotebookPen />
          {item.label}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
