'use client';

import { useCallback, useState } from 'react';

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

interface KanbanColumnProps {
  type: InsightType;
  insights: ProjectInsight[];
  projectId: string;
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
}

export function KanbanColumn({
  type,
  insights,
  projectId,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
}: KanbanColumnProps) {
  const t = useTranslations();
  const [showForm, setShowForm] = useState(false);
  const colors = INSIGHT_COLORS[type];

  const handleAddClick = useCallback(() => {
    setShowForm(true);
  }, []);

  const handleCreated = useCallback(
    (insight: ProjectInsight) => {
      onInsightCreated(insight);
      setShowForm(false);
    },
    [onInsightCreated]
  );

  const handleCancelForm = useCallback(() => {
    setShowForm(false);
  }, []);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      {/* Column header */}
      <div className="flex items-center justify-between pb-1">
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
      {insights.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {insights.map((insight) => (
            <KanbanCard
              key={insight.id}
              insight={insight}
              onUpdated={onInsightUpdated}
              onDeleted={onInsightDeleted}
            />
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="border-border flex items-center justify-center rounded-md border border-dashed py-10">
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
