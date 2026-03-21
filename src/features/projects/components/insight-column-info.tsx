'use client';

import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { InsightType } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';

type ColumnKey = InsightType | 'suggested';

interface InsightColumnInfoProps {
  columnKey: ColumnKey;
}

export function InsightColumnInfo({ columnKey }: InsightColumnInfoProps) {
  const t = useTranslations();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground"
          aria-label={t('projects.suggestions.info' as MessageKey)}
        >
          <Info className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="max-w-xs text-sm">
        {t(`projects.insights.columnInfo.${columnKey}` as MessageKey)}
      </PopoverContent>
    </Popover>
  );
}
