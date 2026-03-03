'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { GripVertical } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { moveInsight } from '@/features/projects/actions/move-insight';
import { reorderInsights } from '@/features/projects/actions/reorder-insights';
import { KanbanCard } from '@/features/projects/components/kanban-card';
import { KanbanColumn } from '@/features/projects/components/kanban-column';
import { INSIGHT_COLORS } from '@/features/projects/config/insight-colors';
import type { InsightType, ProjectInsight } from '@/features/projects/types';
import { INSIGHT_TYPES } from '@/features/projects/types';
import { useKanbanBoard } from '@/hooks/use-kanban-board';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

const PILL_LABEL_KEYS: Record<InsightType, string> = {
  strength: 'projects.scorecard.strengths',
  opportunity: 'projects.scorecard.opportunities',
  threat: 'projects.scorecard.threats',
  decision: 'projects.scorecard.decisions',
};

interface KanbanBoardProps {
  projectId: string;
  insights: ProjectInsight[];
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
  onInsightsChanged?: (insights: ProjectInsight[]) => void;
}

export function KanbanBoard({
  projectId,
  insights,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
  onInsightsChanged,
}: KanbanBoardProps) {
  const t = useTranslations();
  const [activeMobileType, setActiveMobileType] = useState<InsightType>('strength');

  const [localInsights, setLocalInsights] = useState(insights);

  useEffect(() => {
    setLocalInsights(insights);
  }, [insights]);

  const boardRef = useRef<HTMLDivElement>(null);

  const insightsByType = useMemo(() => {
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
  }, [localInsights]);

  const columns = useMemo(() => {
    const result: Record<InsightType, string[]> = {
      strength: [],
      opportunity: [],
      threat: [],
      decision: [],
    };

    for (const type of INSIGHT_TYPES) {
      result[type] = insightsByType[type].map((i) => i.id);
    }

    return result;
  }, [insightsByType]);

  const handleReorder = useCallback(
    (columnId: InsightType, newIds: string[]) => {
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
    },
    [onInsightsChanged]
  );

  const handleMove = useCallback(
    (
      itemId: string,
      fromColumn: InsightType,
      toColumn: InsightType,
      targetColumnIds: string[],
      sourceColumnIds: string[]
    ) => {
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
        newType: toColumn,
        targetColumnInsightIds: targetColumnIds,
        sourceColumnInsightIds: sourceColumnIds,
      }).then((result) => {
        if (result && !result.error) {
          toast.success(
            t('projects.insights.movedTo' as MessageKey, {
              type: t(PILL_LABEL_KEYS[toColumn] as MessageKey),
            })
          );
        }
      });
    },
    [onInsightsChanged, t]
  );

  const {
    draggedId,
    hoveredColumn,
    ghostPosition,
    ghostWidth,
    handleDragStart,
    isDragging,
    showPlaceholderAt,
    showPlaceholderAtEnd,
  } = useKanbanBoard<InsightType>({
    columns,
    columnIds: INSIGHT_TYPES,
    boardRef,
    columnIdAttribute: 'data-column-id',
    itemIdAttribute: 'data-insight-id',
    onReorder: handleReorder,
    onMove: handleMove,
  });

  const handleMoveToType = useCallback(
    (insightId: string, newType: InsightType) => {
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
    },
    [localInsights, insightsByType, handleMove]
  );

  const draggedInsight = draggedId ? localInsights.find((i) => i.id === draggedId) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1.5 overflow-x-auto md:hidden">
        {INSIGHT_TYPES.map((type) => {
          const colors = INSIGHT_COLORS[type];
          const isActive = activeMobileType === type;

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

      <div className="md:hidden">
        <KanbanColumn
          key={activeMobileType}
          type={activeMobileType}
          insights={insightsByType[activeMobileType]}
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

      <div ref={boardRef} className="hidden gap-3 md:flex">
        {INSIGHT_TYPES.map((type) => (
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
            onDragStart={handleDragStart}
            isDragging={isDragging}
            showPlaceholderAt={(index) => showPlaceholderAt(type, index)}
            showPlaceholderAtEnd={showPlaceholderAtEnd(type)}
            onMoveToType={handleMoveToType}
          />
        ))}
      </div>

      {draggedId &&
        draggedInsight &&
        ghostPosition &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="presentation"
            aria-hidden
            className={cn(
              'bg-card pointer-events-none fixed top-0 left-0 z-50 flex items-start gap-2 rounded-lg border border-l-2 px-3 py-2.5 shadow-lg',
              INSIGHT_COLORS[draggedInsight.type as InsightType]?.stripe
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
              {draggedInsight.content}
            </span>
          </div>,
          document.body
        )}
    </div>
  );
}
