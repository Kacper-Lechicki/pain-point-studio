'use client';

import { useMemo, useState } from 'react';

import { SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { acceptSuggestion } from '@/features/projects/actions/accept-suggestion';
import { dismissSuggestion } from '@/features/projects/actions/dismiss-suggestion';
import type { InsightSuggestionsResult } from '@/features/projects/actions/get-insight-suggestions';
import { InsightDialog } from '@/features/projects/components/insight-dialog';
import { InsightsEmptyState } from '@/features/projects/components/insights-empty-state';
import { KanbanBoard } from '@/features/projects/components/kanban-board';
import type { InsightSortBy } from '@/features/projects/components/kanban-toolbar';
import { KanbanToolbar } from '@/features/projects/components/kanban-toolbar';
import type { InsightSource, InsightType, ProjectInsight } from '@/features/projects/types';
import { INSIGHT_TYPES } from '@/features/projects/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';

interface ProjectInsightsTabProps {
  projectId: string;
  insights: ProjectInsight[];
  suggestionsData: InsightSuggestionsResult;
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
  onInsightsChanged: (insights: ProjectInsight[]) => void;
  onNavigateToTab?: (tab: string) => void;
}

export function ProjectInsightsTab({
  projectId,
  insights,
  suggestionsData,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
  onInsightsChanged,
  onNavigateToTab,
}: ProjectInsightsTabProps) {
  const t = useTranslations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDefaultType, setDialogDefaultType] = useState<InsightType | undefined>(undefined);
  const [editingInsight, setEditingInsight] = useState<ProjectInsight | undefined>(undefined);
  const [suggestions, setSuggestions] = useState(suggestionsData.suggestions);
  const [prevSuggestionsData, setPrevSuggestionsData] = useState(suggestionsData);

  if (suggestionsData !== prevSuggestionsData) {
    setPrevSuggestionsData(suggestionsData);
    setSuggestions(suggestionsData.suggestions);
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<InsightType[]>([]);
  const [sourceFilter, setSourceFilter] = useState<InsightSource[]>([]);
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

    if (sourceFilter.length > 0) {
      result = result.filter((i) => sourceFilter.includes(i.source as InsightSource));
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
  }, [insights, searchQuery, typeFilter, sourceFilter, sortBy]);

  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) {
      return suggestions;
    }

    const q = searchQuery.toLowerCase();

    return suggestions.filter((s) => s.content.toLowerCase().includes(q));
  }, [suggestions, searchQuery]);

  const isFiltering = searchQuery.trim() !== '' || typeFilter.length > 0 || sourceFilter.length > 0;
  const hasNoResults =
    isFiltering && filteredInsights.length === 0 && filteredSuggestions.length === 0;
  const visibleTypes = typeFilter.length > 0 ? typeFilter : INSIGHT_TYPES;

  const acceptAction = useFormAction({
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const dismissAction = useFormAction({
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const handleAddClick = (type?: InsightType) => {
    setEditingInsight(undefined);
    setDialogDefaultType(type);
    setDialogOpen(true);
  };

  const handleEdit = (insight: ProjectInsight) => {
    setEditingInsight(insight);
    setDialogDefaultType(undefined);
    setDialogOpen(true);
  };

  const handleDialogCreated = (insight: ProjectInsight) => {
    onInsightCreated(insight);
  };

  const handleDialogUpdated = (insight: ProjectInsight) => {
    onInsightUpdated(insight);
  };

  const handleMoveTo = (signature: string, type: InsightType, content: string) => {
    setSuggestions((prev) => prev.filter((s) => s.signature !== signature));

    const tempInsight: ProjectInsight = {
      id: crypto.randomUUID(),
      project_id: projectId,
      type,
      source: 'survey' as const,
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

  if (insights.length === 0 && suggestions.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <InsightsEmptyState
          onAddInsight={() => handleAddClick()}
          onGoToResearch={onNavigateToTab ? () => onNavigateToTab('surveys') : undefined}
        />

        {dialogOpen && (
          <InsightDialog
            open
            onOpenChange={setDialogOpen}
            projectId={projectId}
            defaultType={dialogDefaultType}
            editInsight={editingInsight}
            onCreated={handleDialogCreated}
            onUpdated={handleDialogUpdated}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <KanbanToolbar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
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
          insights={filteredInsights}
          onInsightUpdated={onInsightUpdated}
          onInsightDeleted={onInsightDeleted}
          onInsightsChanged={onInsightsChanged}
          suggestions={filteredSuggestions}
          totalCompletedResponses={suggestionsData.totalCompletedResponses}
          onSuggestionAccepted={handleMoveTo}
          onSuggestionDismissed={handleDismissed}
          visibleTypes={visibleTypes as InsightType[]}
          onDragCompleted={() => setSortBy('manual')}
          onAddClick={handleAddClick}
          onEdit={handleEdit}
          hasCompletedSurveys={suggestionsData.totalCompletedResponses > 0}
        />
      )}

      {dialogOpen && (
        <InsightDialog
          open
          onOpenChange={setDialogOpen}
          projectId={projectId}
          defaultType={dialogDefaultType}
          editInsight={editingInsight}
          onCreated={handleDialogCreated}
          onUpdated={handleDialogUpdated}
        />
      )}
    </div>
  );
}
