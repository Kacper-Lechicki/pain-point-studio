'use client';

import { useEffect, useRef, useState } from 'react';

import { GripVertical } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';

import { moveInsight } from '@/features/projects/actions/move-insight';
import { reorderInsights } from '@/features/projects/actions/reorder-insights';
import { KanbanCard } from '@/features/projects/components/kanban-card';
import { KanbanColumn } from '@/features/projects/components/kanban-column';
import { SuggestionCard } from '@/features/projects/components/suggestion-card';
import { SuggestionColumn } from '@/features/projects/components/suggestion-panel';
import { INSIGHT_COLORS } from '@/features/projects/config/insight-colors';
import type { InsightSuggestion, InsightType, ProjectInsight } from '@/features/projects/types';
import { INSIGHT_TYPES } from '@/features/projects/types';
import { useKanbanBoard } from '@/hooks/use-kanban-board';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

// ── Board column type (SWOT + optional suggestions) ────────────────

type BoardColumnId = InsightType | 'suggested';

const PILL_LABEL_KEYS: Record<InsightType, string> = {
  strength: 'projects.scorecard.strengths',
  opportunity: 'projects.scorecard.opportunities',
  threat: 'projects.scorecard.threats',
  decision: 'projects.scorecard.decisions',
};

// ── Props ──────────────────────────────────────────────────────────

interface KanbanBoardProps {
  projectId: string;
  insights: ProjectInsight[];
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
  onInsightsChanged?: (insights: ProjectInsight[]) => void;
  /** Suggestion data (null/undefined = column hidden). */
  suggestions?: InsightSuggestion[];
  totalCompletedResponses?: number;
  onSuggestionAccepted?: (signature: string, type: InsightType, content: string) => void;
  onSuggestionDismissed?: (signature: string) => void;
  /** Which SWOT types to show columns for. Defaults to all. */
  visibleTypes?: readonly InsightType[];
  /** Called when a drag operation completes (reorder or move). */
  onDragCompleted?: () => void;
}

export function KanbanBoard({
  projectId,
  insights,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
  onInsightsChanged,
  suggestions,
  totalCompletedResponses = 0,
  onSuggestionAccepted,
  onSuggestionDismissed,
  visibleTypes,
  onDragCompleted,
}: KanbanBoardProps) {
  const t = useTranslations();
  const [activeMobileType, setActiveMobileType] = useState<InsightType>('strength');

  const [localInsights, setLocalInsights] = useState(insights);

  useEffect(() => {
    setLocalInsights(insights);
  }, [insights]);

  const boardRef = useRef<HTMLDivElement>(null);

  const hasSuggestions = !!suggestions;
  const typesToRender: readonly InsightType[] =
    visibleTypes && visibleTypes.length > 0 ? visibleTypes : INSIGHT_TYPES;
  const totalColumns = INSIGHT_TYPES.length + (hasSuggestions ? 1 : 0);

  // Reset mobile tab if filtered out
  const effectiveMobileType: InsightType = typesToRender.includes(activeMobileType)
    ? activeMobileType
    : (typesToRender[0] ?? 'strength');

  // ── Group insights by type ─────────────────────────────────────

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

  // ── Build columns map (with optional suggestions column) ───────

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

  // ── Drag callbacks ─────────────────────────────────────────────

  const handleReorder = (columnId: BoardColumnId, newIds: string[]) => {
    // Reordering within 'suggested' column — no persistence needed
    if (columnId === 'suggested') {return;}

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
    // Prevent dropping INTO the suggested column
    if (toColumn === 'suggested') {return;}

    // Moving FROM suggested → SWOT column = accept suggestion
    if (fromColumn === 'suggested') {
      const suggestion = suggestions?.find((s) => s.signature === itemId);

      if (suggestion && onSuggestionAccepted) {
        onSuggestionAccepted(suggestion.signature, toColumn as InsightType, suggestion.content);
      }

      return;
    }

    // Normal SWOT → SWOT move
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

    setActiveMobileType(newType);
  };

  // ── Ghost card content ─────────────────────────────────────────

  const draggedInsight = draggedId ? localInsights.find((i) => i.id === draggedId) : null;
  const draggedSuggestion =
    draggedId && !draggedInsight ? suggestions?.find((s) => s.signature === draggedId) : null;
  const ghostContent = draggedInsight?.content ?? draggedSuggestion?.content ?? '';
  const ghostStripe = draggedInsight
    ? INSIGHT_COLORS[draggedInsight.type as InsightType]?.stripe
    : undefined;

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile: suggestions column above tabs */}
      {hasSuggestions && (
        <div className="md:hidden">
          <SuggestionColumn
            suggestions={suggestions ?? []}
            totalCompletedResponses={totalCompletedResponses}
            onMoveTo={(sig, type, content) => onSuggestionAccepted?.(sig, type, content)}
            onDismissed={(sig) => onSuggestionDismissed?.(sig)}
            renderCard={(suggestion) => (
              <SuggestionCard
                key={suggestion.signature}
                suggestion={suggestion}
                onMoveTo={(sig, type, content) => onSuggestionAccepted?.(sig, type, content)}
                onDismissed={(sig) => onSuggestionDismissed?.(sig)}
                hideDragHandle
              />
            )}
          />
        </div>
      )}

      {/* Mobile: type tabs */}
      <div className="flex gap-1.5 overflow-x-auto md:hidden">
        {typesToRender.map((type) => {
          const colors = INSIGHT_COLORS[type];
          const isActive = effectiveMobileType === type;

          return (
            <button
              key={type}
              type="button"
              onClick={() => setActiveMobileType(type)}
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? cn(colors.pillBg, colors.pillBorder, colors.pillText)
                  : 'border-border text-muted-foreground'
              )}
            >
              {isActive && <span className={cn('size-1.5 rounded-full', colors.dot)} aria-hidden />}
              {t(PILL_LABEL_KEYS[type] as MessageKey)}
            </button>
          );
        })}
      </div>

      {/* Mobile: active column */}
      <div className="md:hidden">
        <KanbanColumn
          key={effectiveMobileType}
          type={effectiveMobileType}
          insights={insightsByType[effectiveMobileType]}
          projectId={projectId}
          onInsightCreated={onInsightCreated}
          onInsightUpdated={onInsightUpdated}
          onInsightDeleted={onInsightDeleted}
          onMoveToType={handleMoveToType}
          renderCard={(insight) => (
            <KanbanCard
              key={insight.id}
              insight={insight}
              onUpdated={onInsightUpdated}
              onDeleted={onInsightDeleted}
              hideDragHandle
              showStripe
              onMoveToType={handleMoveToType}
            />
          )}
        />
      </div>

      {/* Desktop: all columns */}
      <div
        ref={boardRef}
        className="hidden gap-3 md:grid"
        style={{ gridTemplateColumns: `repeat(${totalColumns}, minmax(0, 1fr))` }}
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
          />
        )}
        {typesToRender.map((type) => (
          <KanbanColumn
            key={type}
            type={type}
            insights={insightsByType[type]}
            projectId={projectId}
            onInsightCreated={onInsightCreated}
            onInsightUpdated={onInsightUpdated}
            onInsightDeleted={onInsightDeleted}
            isDropTarget={!!draggedId && hoveredColumn === type}
            isDragActive={!!draggedId}
            onMoveToType={handleMoveToType}
            onDragStart={handleDragStart}
            isDragging={isDragging}
            showPlaceholderAt={(index) => showPlaceholderAt(type, index)}
            showPlaceholderAtEnd={showPlaceholderAtEnd(type)}
          />
        ))}
      </div>

      {/* Drag ghost */}
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
