'use client';

import { useState } from 'react';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { InsightInlineForm } from '@/features/projects/components/insight-inline-form';
import { KanbanCard } from '@/features/projects/components/kanban-card';
import { INSIGHT_COLORS } from '@/features/projects/config/insight-colors';
import type { InsightType, ProjectInsight } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

/** Maps insight type to its i18n key for the column header. */
const COLUMN_LABEL_KEYS: Record<InsightType, string> = {
  strength: 'projects.scorecard.strengths',
  opportunity: 'projects.scorecard.opportunities',
  threat: 'projects.scorecard.threats',
  decision: 'projects.scorecard.decisions',
};

/** Drop placeholder shown between cards during drag. */
function DropPlaceholder() {
  return (
    <div className="border-primary/50 bg-primary/5 mb-2 min-h-10 rounded-lg border border-dashed md:min-h-9" />
  );
}

interface KanbanColumnProps {
  type: InsightType;
  insights: ProjectInsight[];
  projectId: string;
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
  /** Whether a card from another column is hovering over this column. */
  isDropTarget?: boolean;
  /** Whether any drag is happening on the board. */
  isDragActive?: boolean;
  /** Called when pointer goes down on a card's drag handle. */
  onDragStart?: (e: React.PointerEvent, insightId: string) => void;
  /** Returns true if this insight is currently being dragged. */
  isDragging?: (insightId: string) => boolean;
  /** Returns true if a drop placeholder should be shown at this index. */
  showPlaceholderAt?: (index: number) => boolean;
  /** Whether to show a placeholder after the last card. */
  showPlaceholderAtEnd?: boolean;
  /** Optional custom card renderer (e.g. for mobile cards). */
  renderCard?: (insight: ProjectInsight) => React.ReactNode;
  /** Called when a card requests moving to another type via submenu. */
  onMoveToType?: (insightId: string, newType: InsightType) => void;
}

export function KanbanColumn({
  type,
  insights,
  projectId,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
  isDropTarget,
  isDragActive,
  onDragStart,
  isDragging,
  showPlaceholderAt,
  showPlaceholderAtEnd,
  renderCard,
  onMoveToType,
}: KanbanColumnProps) {
  const t = useTranslations();
  const [showForm, setShowForm] = useState(false);
  const colors = INSIGHT_COLORS[type];

  const handleAddClick = () => {
    setShowForm(true);
  };

  const handleCreated = (insight: ProjectInsight) => {
    onInsightCreated(insight);
    setShowForm(false);
  };

  const handleCancelForm = () => {
    setShowForm(false);
  };

  return (
    <div
      data-column-id={type}
      className={cn(
        'bg-muted dark:bg-muted flex min-w-0 flex-col gap-2.5 rounded-xl p-3 transition-colors',
        isDropTarget && 'bg-primary/5 ring-primary/20 ring-1'
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-1 pb-1">
        <div className="flex items-center gap-1.5">
          <span className={cn('size-2 rounded-full', colors.dot)} aria-hidden />
          <span
            className={cn('text-[11px] font-semibold tracking-wide uppercase', colors.headerText)}
          >
            {t(COLUMN_LABEL_KEYS[type] as MessageKey)}
          </span>
          <span className="text-muted-foreground text-[11px]">{insights.length}</span>
        </div>

        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground"
          onClick={handleAddClick}
          aria-label={t('projects.insights.addInsight' as MessageKey)}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Card list */}
      {insights.length > 0 || isDragActive ? (
        <div className="flex flex-col gap-2">
          {insights.map((insight, index) => (
            <div key={insight.id}>
              {showPlaceholderAt?.(index) && <DropPlaceholder />}
              <div data-insight-id={insight.id}>
                {renderCard ? (
                  renderCard(insight)
                ) : (
                  <KanbanCard
                    insight={insight}
                    onUpdated={onInsightUpdated}
                    onDeleted={onInsightDeleted}
                    showStripe
                    {...(onMoveToType && { onMoveToType })}
                    {...(onDragStart && {
                      onDragStart: (e: React.PointerEvent) => onDragStart(e, insight.id),
                    })}
                    isDragging={isDragging?.(insight.id) ?? false}
                  />
                )}
              </div>
            </div>
          ))}
          {showPlaceholderAtEnd && <DropPlaceholder />}
        </div>
      ) : (
        !showForm && (
          <div className="border-border/70 dark:border-border/80 flex items-center justify-center rounded-lg border border-dashed py-10">
            <span className="text-muted-foreground text-xs">
              {t('projects.insights.addInsightsHere' as MessageKey)}
            </span>
          </div>
        )
      )}

      {/* Inline add form */}
      {showForm && (
        <InsightInlineForm
          projectId={projectId}
          type={type}
          alwaysOpen
          onCancel={handleCancelForm}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
