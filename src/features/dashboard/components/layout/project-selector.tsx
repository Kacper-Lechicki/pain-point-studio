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
  const t = useTranslations();

  return (
    <Select defaultValue="default" name="project">
      <SelectTrigger
        size="sm"
        className={cn(
          'border-border/50 min-h-8 w-full rounded-lg px-2 py-0',
          'gap-2.5 **:data-[slot=select-value]:min-w-0 **:data-[slot=select-value]:flex-1 **:data-[slot=select-value]:justify-start **:data-[slot=select-value]:gap-0',
          className ?? 'w-44'
        )}
        aria-label={t('navbar.selectProject')}
      >
        <FolderKanban className="text-muted-foreground size-4 shrink-0" aria-hidden />
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="default">{t('navbar.projectPlaceholder')}</SelectItem>
      </SelectContent>
    </Select>
  );
}
