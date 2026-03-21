'use client';

import { useEffect, useRef, useState } from 'react';

import { GripVertical } from 'lucide-react';
import { createPortal } from 'react-dom';

import { moveInsight } from '@/features/projects/actions/move-insight';
import { reorderInsights } from '@/features/projects/actions/reorder-insights';
import { KanbanColumn } from '@/features/projects/components/kanban-column';
import { SuggestionColumn } from '@/features/projects/components/suggestion-panel';
import { INSIGHT_COLORS } from '@/features/projects/config/insight-colors';
import type { InsightSuggestion, InsightType, ProjectInsight } from '@/features/projects/types';
import { INSIGHT_TYPES } from '@/features/projects/types';
import { useKanbanBoard } from '@/hooks/use-kanban-board';
import { cn } from '@/lib/common/utils';

type BoardColumnId = InsightType | 'suggested';

interface KanbanBoardProps {
  insights: ProjectInsight[];
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
  onInsightsChanged?: (insights: ProjectInsight[]) => void;
  suggestions?: InsightSuggestion[];
  totalCompletedResponses?: number;
  onSuggestionAccepted?: (signature: string, type: InsightType, content: string) => void;
  onSuggestionDismissed?: (signature: string) => void;
  visibleTypes?: readonly InsightType[];
  onDragCompleted?: () => void;
  onAddClick?: (type: InsightType) => void;
  onEdit?: (insight: ProjectInsight) => void;
  hasCompletedSurveys?: boolean;
}

export function KanbanBoard({
  insights,
  onInsightUpdated,
  onInsightDeleted,
  onInsightsChanged,
  suggestions,
  totalCompletedResponses = 0,
  onSuggestionAccepted,
  onSuggestionDismissed,
  visibleTypes,
  onDragCompleted,
  onAddClick,
  onEdit,
  hasCompletedSurveys,
}: KanbanBoardProps) {
  const [localInsights, setLocalInsights] = useState(insights);

  useEffect(() => {
    setLocalInsights(insights);
  }, [insights]);

  const boardRef = useRef<HTMLDivElement>(null);

  const hasSuggestions = !!suggestions;
  const typesToRender: readonly InsightType[] =
    visibleTypes && visibleTypes.length > 0 ? visibleTypes : INSIGHT_TYPES;
  const totalColumns = INSIGHT_TYPES.length + (hasSuggestions ? 1 : 0);

  const insightsByType = (() => {
    const grouped: Record<InsightType, ProjectInsight[]> = {
      strength: [],
      opportunity: [],
      threat: [],
      decision: [],
    };

    for (const insight of localInsights) {
      const type = insight.type as InsightType;

      if (grouped[type]) {
        grouped[type].push(insight);
      }
    }

    for (const type of INSIGHT_TYPES) {
      grouped[type].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }

    return grouped;
  })();

  const allColumnIds: readonly BoardColumnId[] = hasSuggestions
    ? (['suggested', ...typesToRender] as const)
    : typesToRender;

  const columns = (() => {
    const result: Record<string, string[]> = {};

    if (hasSuggestions) {
      result.suggested = (suggestions ?? []).map((s) => s.signature);
    }

    for (const type of INSIGHT_TYPES) {
      result[type] = insightsByType[type].map((i) => i.id);
    }

    return result as Record<BoardColumnId, string[]>;
  })();

  const handleReorder = (columnId: BoardColumnId, newIds: string[]) => {
    if (columnId === 'suggested') {
      return;
    }

    setLocalInsights((prev) => {
      const updated = prev.map((insight) => {
        if (insight.type !== columnId) {
          return insight;
        }

        const newIndex = newIds.indexOf(insight.id);

        if (newIndex === -1) {
          return insight;
        }

        return { ...insight, sort_order: newIndex };
      });

      queueMicrotask(() => onInsightsChanged?.(updated));

      return updated;
    });

    void reorderInsights({ insightIds: newIds });
    onDragCompleted?.();
  };

  const handleMove = (
    itemId: string,
    fromColumn: BoardColumnId,
    toColumn: BoardColumnId,
    targetColumnIds: string[],
    sourceColumnIds: string[]
  ) => {
    if (toColumn === 'suggested') {
      return;
    }

    if (fromColumn === 'suggested') {
      const suggestion = suggestions?.find((s) => s.signature === itemId);

      if (suggestion && onSuggestionAccepted) {
        onSuggestionAccepted(suggestion.signature, toColumn as InsightType, suggestion.content);
      }

      return;
    }

    setLocalInsights((prev) => {
      const updated = prev.map((insight) => {
        if (insight.id === itemId) {
          return {
            ...insight,
            type: toColumn,
            sort_order: targetColumnIds.indexOf(itemId),
            updated_at: new Date().toISOString(),
          };
        }

        if (insight.type === fromColumn) {
          const idx = sourceColumnIds.indexOf(insight.id);

          if (idx !== -1) {
            return { ...insight, sort_order: idx };
          }
        }

        if (insight.type === toColumn) {
          const idx = targetColumnIds.indexOf(insight.id);

          if (idx !== -1) {
            return { ...insight, sort_order: idx };
          }
        }

        return insight;
      });

      queueMicrotask(() => onInsightsChanged?.(updated));

      return updated;
    });

    void moveInsight({
      insightId: itemId,
      newType: toColumn as InsightType,
      targetColumnInsightIds: targetColumnIds,
      sourceColumnInsightIds: sourceColumnIds,
    });
    onDragCompleted?.();
  };

  const {
    draggedId,
    hoveredColumn,
    ghostPosition,
    ghostWidth,
    handleDragStart,
    isDragging,
    showPlaceholderAt,
    showPlaceholderAtEnd,
  } = useKanbanBoard<BoardColumnId>({
    columns,
    columnIds: allColumnIds,
    boardRef,
    columnIdAttribute: 'data-column-id',
    itemIdAttribute: 'data-insight-id',
    onReorder: handleReorder,
    onMove: handleMove,
    ...(hasSuggestions && { disabledColumns: ['suggested'] as const }),
  });

  const handleMoveToType = (insightId: string, newType: InsightType) => {
    const insight = localInsights.find((i) => i.id === insightId);

    if (!insight) {
      return;
    }

    const targetColumnIds = [...insightsByType[newType].map((i) => i.id), insightId];
    const sourceColumnIds = insightsByType[insight.type as InsightType]
      .filter((i) => i.id !== insightId)
      .map((i) => i.id);

    handleMove(insightId, insight.type as InsightType, newType, targetColumnIds, sourceColumnIds);
  };

  const draggedInsight = draggedId ? localInsights.find((i) => i.id === draggedId) : null;
  const draggedSuggestion =
    draggedId && !draggedInsight ? suggestions?.find((s) => s.signature === draggedId) : null;
  const ghostContent = draggedInsight?.content ?? draggedSuggestion?.content ?? '';
  const ghostStripe = draggedInsight
    ? INSIGHT_COLORS[draggedInsight.type as InsightType]?.stripe
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={boardRef}
        className="grid gap-3 overflow-x-auto pb-2"
        style={{ gridTemplateColumns: `repeat(${totalColumns}, minmax(280px, 1fr))` }}
      >
        {hasSuggestions && (
          <SuggestionColumn
            suggestions={suggestions ?? []}
            totalCompletedResponses={totalCompletedResponses}
            onMoveTo={(sig, type, content) => onSuggestionAccepted?.(sig, type, content)}
            onDismissed={(sig) => onSuggestionDismissed?.(sig)}
            isDropTarget={!!draggedId && hoveredColumn === 'suggested'}
            isDragActive={!!draggedId}
            onDragStart={handleDragStart}
            isDragging={isDragging}
            showPlaceholderAt={(index) => showPlaceholderAt('suggested', index)}
            showPlaceholderAtEnd={showPlaceholderAtEnd('suggested')}
            hasCompletedSurveys={hasCompletedSurveys}
          />
        )}
        {typesToRender.map((type) => (
          <KanbanColumn
            key={type}
            type={type}
            insights={insightsByType[type]}
            onInsightUpdated={onInsightUpdated}
            onInsightDeleted={onInsightDeleted}
            isDropTarget={!!draggedId && hoveredColumn === type}
            isDragActive={!!draggedId}
            onMoveToType={handleMoveToType}
            onDragStart={handleDragStart}
            isDragging={isDragging}
            showPlaceholderAt={(index) => showPlaceholderAt(type, index)}
            showPlaceholderAtEnd={showPlaceholderAtEnd(type)}
            onAddClick={onAddClick}
            onEdit={onEdit}
          />
        ))}
      </div>

      {draggedId &&
        ghostContent &&
        ghostPosition &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="presentation"
            aria-hidden
            className={cn(
              'bg-card pointer-events-none fixed top-0 left-0 z-50 flex items-start gap-2 rounded-lg border px-3 py-2.5 shadow-lg',
              ghostStripe && 'border-l-2',
              ghostStripe
            )}
            style={{
              transform: `translate3d(${ghostPosition.x}px, ${ghostPosition.y}px, 0) rotate(1deg)`,
              width: ghostWidth || 'auto',
              minWidth: 180,
              opacity: 0.95,
              willChange: 'transform',
            }}
          >
            <GripVertical className="text-muted-foreground mt-0.5 size-3 shrink-0" aria-hidden />
            <span className="text-foreground min-w-0 flex-1 truncate text-[13px] leading-relaxed">
              {ghostContent}
            </span>
          </div>,
          document.body
        )}
    </div>
  );
}
