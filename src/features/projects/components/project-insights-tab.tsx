'use client';

import { useMemo, useState } from 'react';

import { Lightbulb, Plus, SearchX } from 'lucide-react';
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
import { acceptSuggestion } from '@/features/projects/actions/accept-suggestion';
import { dismissSuggestion } from '@/features/projects/actions/dismiss-suggestion';
import type { InsightSuggestionsResult } from '@/features/projects/actions/get-insight-suggestions';
import type { PendingInsightSurvey } from '@/features/projects/actions/get-pending-insight-surveys';
import { InsightInlineForm } from '@/features/projects/components/insight-inline-form';
import { KanbanBoard } from '@/features/projects/components/kanban-board';
import type { InsightSortBy } from '@/features/projects/components/kanban-toolbar';
import { KanbanToolbar } from '@/features/projects/components/kanban-toolbar';
import { PendingInsightsBanner } from '@/features/projects/components/pending-insights-banner';
import type { InsightType, ProjectInsight } from '@/features/projects/types';
import { INSIGHT_TYPES } from '@/features/projects/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';

interface ProjectInsightsTabProps {
  projectId: string;
  insights: ProjectInsight[];
  suggestionsData: InsightSuggestionsResult;
  pendingSurveys: PendingInsightSurvey[];
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
  onInsightsChanged: (insights: ProjectInsight[]) => void;
}

export function ProjectInsightsTab({
  projectId,
  insights,
  suggestionsData,
  pendingSurveys,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
  onInsightsChanged,
}: ProjectInsightsTabProps) {
  const t = useTranslations();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [suggestions, setSuggestions] = useState(suggestionsData.suggestions);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<InsightType[]>([]);
  const [sortBy, setSortBy] = useState<InsightSortBy>('manual');

  const typeCounts = useMemo(() => {
    const counts: Record<InsightType, number> = {
      strength: 0,
      opportunity: 0,
      threat: 0,
      decision: 0,
    };

    for (const i of insights) {
      const type = i.type as InsightType;

      if (counts[type] !== undefined) {
        counts[type]++;
      }
    }

    return counts;
  }, [insights]);

  const filteredInsights = useMemo(() => {
    let result = insights;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) => i.content.toLowerCase().includes(q));
    }

    if (typeFilter.length > 0) {
      result = result.filter((i) => typeFilter.includes(i.type as InsightType));
    }

    if (sortBy !== 'manual') {
      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'oldest':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case 'updated':
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          case 'alphabetical':
            return a.content.localeCompare(b.content);
          default:
            return 0;
        }
      });
    }

    return result;
  }, [insights, searchQuery, typeFilter, sortBy]);

  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) {
      return suggestions;
    }

    const q = searchQuery.toLowerCase();

    return suggestions.filter((s) => s.content.toLowerCase().includes(q));
  }, [suggestions, searchQuery]);

  const isFiltering = searchQuery.trim() !== '' || typeFilter.length > 0;
  const hasNoResults =
    isFiltering && filteredInsights.length === 0 && filteredSuggestions.length === 0;
  const visibleTypes = typeFilter.length > 0 ? typeFilter : INSIGHT_TYPES;

  const acceptAction = useFormAction({
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const dismissAction = useFormAction({
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const handleInsightCreated = (insight: ProjectInsight) => {
    onInsightCreated(insight);
    setAddDialogOpen(false);
  };

  const handleMoveTo = (signature: string, type: InsightType, content: string) => {
    setSuggestions((prev) => prev.filter((s) => s.signature !== signature));

    const tempInsight: ProjectInsight = {
      id: crypto.randomUUID(),
      project_id: projectId,
      type,
      content,
      sort_order: 0,
      phase: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onInsightCreated(tempInsight);

    void acceptAction.execute(acceptSuggestion, {
      projectId,
      signature,
      type,
      content,
    });
  };

  const handleDismissed = (signature: string) => {
    setSuggestions((prev) => prev.filter((s) => s.signature !== signature));

    void dismissAction.execute(dismissSuggestion, {
      projectId,
      signature,
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePendingDecided = (_surveyId: string, _included: boolean) => {};

  const pendingBanner = pendingSurveys.length > 0 && (
    <PendingInsightsBanner surveys={pendingSurveys} onDecided={handlePendingDecided} />
  );

  if (insights.length === 0 && suggestions.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {pendingBanner}

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
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {pendingBanner}

      <KanbanToolbar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        typeCounts={typeCounts}
      />

      {hasNoResults ? (
        <div className="flex flex-col items-center py-16 text-center">
          <SearchX className="text-muted-foreground size-8" aria-hidden />
          <p className="text-foreground mt-3 text-base font-medium">
            {t('projects.insights.toolbar.noResults' as MessageKey)}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('projects.insights.toolbar.noResultsDescription' as MessageKey)}
          </p>
        </div>
      ) : (
        <KanbanBoard
          projectId={projectId}
          insights={filteredInsights}
          onInsightCreated={onInsightCreated}
          onInsightUpdated={onInsightUpdated}
          onInsightDeleted={onInsightDeleted}
          onInsightsChanged={onInsightsChanged}
          suggestions={filteredSuggestions}
          totalCompletedResponses={suggestionsData.totalCompletedResponses}
          onSuggestionAccepted={handleMoveTo}
          onSuggestionDismissed={handleDismissed}
          visibleTypes={visibleTypes as InsightType[]}
          onDragCompleted={() => setSortBy('manual')}
        />
      )}
    </div>
  );
}
