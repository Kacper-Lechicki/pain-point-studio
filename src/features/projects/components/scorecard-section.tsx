'use client';

import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { InsightInlineForm } from '@/features/projects/components/insight-inline-form';
import { InsightItem } from '@/features/projects/components/insight-item';
import { SignalItem } from '@/features/projects/components/signal-item';
import type { InsightType, ProjectInsight, Signal } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';

interface ScorecardSectionProps {
  title: string;
  icon: LucideIcon;
  signals: Signal[];
  insights: ProjectInsight[];
  insightType: InsightType;
  projectId: string;
  emptyMessageKey: MessageKey;
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
}

export function ScorecardSection({
  title,
  icon: Icon,
  signals,
  insights,
  insightType,
  projectId,
  emptyMessageKey,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
}: ScorecardSectionProps) {
  const t = useTranslations();
  const totalItems = signals.length + insights.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
        <h3 className="text-foreground text-sm font-medium">{title}</h3>
        <span className="text-muted-foreground text-xs">({totalItems})</span>
      </div>

      {totalItems === 0 ? (
        <p className="text-muted-foreground px-3 py-2 text-xs">{t(emptyMessageKey)}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {signals.map((signal, i) => (
            <SignalItem
              key={`signal-${signal.source}-${signal.questionText ?? i}`}
              signal={signal}
            />
          ))}

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
