'use client';

import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { InsightInlineForm } from '@/features/projects/components/insight-inline-form';
import { InsightItem } from '@/features/projects/components/insight-item';
import type { InsightType, ProjectInsight } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface ScorecardSectionProps {
  title: string;
  icon: LucideIcon;
  insights: ProjectInsight[];
  insightType: InsightType;
  projectId: string;
  emptyMessageKey: MessageKey;
  /** Visual feedback when a finding is being dragged over this section. */
  isOver?: boolean;
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
}

export function ScorecardSection({
  title,
  icon: Icon,
  insights,
  insightType,
  projectId,
  emptyMessageKey,
  isOver = false,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
}: ScorecardSectionProps) {
  const t = useTranslations();

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-transparent p-3 transition-colors',
        isOver && 'border-primary/40 bg-primary/5'
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
        <h3 className="text-foreground text-sm font-medium">{title}</h3>
        <span className="text-muted-foreground text-xs">({insights.length})</span>
      </div>

      {insights.length === 0 ? (
        <p className="text-muted-foreground px-3 py-2 text-xs">{t(emptyMessageKey)}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {insights.map((insight) => (
            <InsightItem
              key={insight.id}
              insight={insight}
              onUpdated={onInsightUpdated}
              onDeleted={onInsightDeleted}
            />
          ))}
        </div>
      )}

      <InsightInlineForm
        projectId={projectId}
        type={insightType}
        phase={null}
        onCreated={onInsightCreated}
      />
    </div>
  );
}
