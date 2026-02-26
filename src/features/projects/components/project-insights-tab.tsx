'use client';

import { useCallback, useState } from 'react';

import { Lightbulb, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { HeroHighlight } from '@/components/ui/hero-highlight';
import { InsightsToolbar } from '@/features/projects/components/insights-toolbar';
import { KanbanBoard } from '@/features/projects/components/kanban-board';
import type { ProjectInsight } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';

interface ProjectInsightsTabProps {
  projectId: string;
  insights: ProjectInsight[];
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
}

export function ProjectInsightsTab({
  projectId,
  insights,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
}: ProjectInsightsTabProps) {
  const t = useTranslations();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

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

        {/* Reuse toolbar's dialog for the empty state CTA */}
        <InsightsToolbar
          projectId={projectId}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          dialogOpen={addDialogOpen}
          onDialogOpenChange={setAddDialogOpen}
          onInsightCreated={handleInsightCreated}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <InsightsToolbar
        projectId={projectId}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        dialogOpen={addDialogOpen}
        onDialogOpenChange={setAddDialogOpen}
        onInsightCreated={handleInsightCreated}
      />

      <KanbanBoard
        projectId={projectId}
        insights={insights}
        onInsightCreated={onInsightCreated}
        onInsightUpdated={onInsightUpdated}
        onInsightDeleted={onInsightDeleted}
      />
    </div>
  );
}
