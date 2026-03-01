'use client';

import { useCallback, useState } from 'react';

import { Lightbulb, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HeroHighlight } from '@/components/ui/hero-highlight';
import { InsightInlineForm } from '@/features/projects/components/insight-inline-form';
import { KanbanBoard } from '@/features/projects/components/kanban-board';
import type { ProjectInsight } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';

interface ProjectInsightsTabProps {
  projectId: string;
  insights: ProjectInsight[];
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
  onInsightsChanged: (insights: ProjectInsight[]) => void;
}

export function ProjectInsightsTab({
  projectId,
  insights,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
  onInsightsChanged,
}: ProjectInsightsTabProps) {
  const t = useTranslations();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleInsightCreated = useCallback(
    (insight: ProjectInsight) => {
      onInsightCreated(insight);
      setAddDialogOpen(false);
    },
    [onInsightCreated]
  );

  if (insights.length === 0) {
    return (
      <>
        <HeroHighlight
          showDotsOnMobile={false}
          containerClassName="w-full rounded-lg border border-dashed border-border"
        >
          <div className="flex w-full flex-col items-center px-4 py-12 text-center md:py-16">
            <Lightbulb className="text-muted-foreground size-8" aria-hidden />
            <p className="text-foreground mt-3 text-base font-medium">
              {t('projects.insights.emptyTitle' as MessageKey)}
            </p>
            <p className="text-muted-foreground mt-1 max-w-sm text-sm">
              {t('projects.insights.emptyDescription' as MessageKey)}
            </p>
            <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
              <Plus className="size-3.5" aria-hidden />
              {t('projects.insights.emptyCta' as MessageKey)}
            </Button>
          </div>
        </HeroHighlight>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
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
              onCancel={() => setAddDialogOpen(false)}
              onCreated={handleInsightCreated}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <KanbanBoard
      projectId={projectId}
      insights={insights}
      onInsightCreated={onInsightCreated}
      onInsightUpdated={onInsightUpdated}
      onInsightDeleted={onInsightDeleted}
      onInsightsChanged={onInsightsChanged}
    />
  );
}
