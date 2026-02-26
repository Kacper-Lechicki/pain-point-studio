'use client';

import { Columns3, List, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InsightInlineForm } from '@/features/projects/components/insight-inline-form';
import type { ProjectInsight } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

type ViewMode = 'board' | 'list';

interface InsightsToolbarProps {
  projectId: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  dialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
  onInsightCreated: (insight: ProjectInsight) => void;
}

export function InsightsToolbar({
  projectId,
  viewMode,
  onViewModeChange,
  dialogOpen,
  onDialogOpenChange,
  onInsightCreated,
}: InsightsToolbarProps) {
  const t = useTranslations();

  return (
    <>
      <div className="flex items-center justify-between">
        {/* Mobile: full-width add button */}
        <Button className="w-full md:hidden" onClick={() => onDialogOpenChange(true)}>
          <Plus className="size-3.5" aria-hidden />
          {t('projects.insights.addInsight' as MessageKey)}
        </Button>

        {/* Desktop: compact add button */}
        <Button className="hidden md:inline-flex" onClick={() => onDialogOpenChange(true)}>
          <Plus className="size-3.5" aria-hidden />
          {t('projects.insights.addInsight' as MessageKey)}
        </Button>

        {/* View toggle — desktop only */}
        <div className="hidden items-center rounded-md border p-0.5 md:flex">
          <button
            type="button"
            onClick={() => onViewModeChange('board')}
            className={cn(
              'rounded px-2 py-1.5 transition-colors',
              viewMode === 'board'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label={t('projects.insights.boardView' as MessageKey)}
          >
            <Columns3 className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={cn(
              'rounded px-2 py-1.5 transition-colors',
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label={t('projects.insights.listView' as MessageKey)}
          >
            <List className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Add Insight dialog */}
      <Dialog open={dialogOpen} onOpenChange={onDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('projects.insights.addInsight' as MessageKey)}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('projects.insights.emptyDescription' as MessageKey)}
            </DialogDescription>
          </DialogHeader>

          <InsightInlineForm
            projectId={projectId}
            showTypeSelector
            alwaysOpen
            onCancel={() => onDialogOpenChange(false)}
            onCreated={(insight) => {
              onInsightCreated(insight);
              onDialogOpenChange(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
