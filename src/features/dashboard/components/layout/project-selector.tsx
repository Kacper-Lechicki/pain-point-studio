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
import { cn } from '@/lib/common/utils';

interface ProjectSelectorProps {
  className?: string;
}

export function ProjectSelector({ className }: ProjectSelectorProps) {
  const t = useTranslations('navbar');

  return (
    <Select defaultValue="default" name="project">
      <SelectTrigger
        size="sm"
        className={cn(
          'border-border/50 min-h-8 w-full rounded-lg px-2 py-0',
          'gap-2.5 [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:flex-1 [&_[data-slot=select-value]]:justify-start [&_[data-slot=select-value]]:gap-0',
          className ?? 'w-44'
        )}
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
