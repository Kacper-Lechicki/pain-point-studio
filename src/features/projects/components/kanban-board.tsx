'use client';

import { useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { KanbanColumn } from '@/features/projects/components/kanban-column';
import { INSIGHT_COLORS } from '@/features/projects/config/insight-colors';
import type { InsightType, ProjectInsight } from '@/features/projects/types';
import { INSIGHT_TYPES } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

/** Maps insight type to its i18n key for the pill label. */
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
}

export function KanbanBoard({
  projectId,
  insights,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
}: KanbanBoardProps) {
  const t = useTranslations();
  const [activeMobileType, setActiveMobileType] = useState<InsightType>('strength');

  const insightsByType = useMemo(() => {
    const grouped: Record<InsightType, ProjectInsight[]> = {
      strength: [],
      opportunity: [],
      threat: [],
      decision: [],
    };

    for (const insight of insights) {
      const type = insight.type as InsightType;

      if (grouped[type]) {
        grouped[type].push(insight);
      }
    }

    return grouped;
  }, [insights]);

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile: filter pills */}
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
                'flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
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

      {/* Mobile: single column for active type */}
      <div className="md:hidden">
        <KanbanColumn
          key={activeMobileType}
          type={activeMobileType}
          insights={insightsByType[activeMobileType]}
          projectId={projectId}
          onInsightCreated={onInsightCreated}
          onInsightUpdated={onInsightUpdated}
          onInsightDeleted={onInsightDeleted}
        />
      </div>

      {/* Desktop: 4-column kanban board */}
      <div className="hidden gap-3 md:flex">
        {INSIGHT_TYPES.map((type) => (
          <KanbanColumn
            key={type}
            type={type}
            insights={insightsByType[type]}
            projectId={projectId}
            onInsightCreated={onInsightCreated}
            onInsightUpdated={onInsightUpdated}
            onInsightDeleted={onInsightDeleted}
          />
        ))}
      </div>
    </div>
  );
}
