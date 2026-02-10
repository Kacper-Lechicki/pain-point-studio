'use client';

import { FolderKanban } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProjectSelectorProps {
  className?: string;
}

export function ProjectSelector({ className }: ProjectSelectorProps) {
  const t = useTranslations('navbar');

  return (
    <Select defaultValue="default" name="project">
      <SelectTrigger
        size="sm"
        className={`gap-2 ${className ?? 'w-44'}`}
        aria-label={t('selectProject')}
      >
        <FolderKanban className="text-muted-foreground size-4 shrink-0" aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">{t('projectPlaceholder')}</SelectItem>
      </SelectContent>
    </Select>
  );
}
