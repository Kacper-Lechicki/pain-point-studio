'use client';

import { useMemo } from 'react';

import { Compass, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ScorecardSection } from '@/features/projects/components/scorecard-section';
import type { InsightType, ProjectInsight, Signal } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';

interface ProjectScorecardProps {
  projectId: string;
  signals: { strengths: Signal[]; threats: Signal[] };
  insights: ProjectInsight[];
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
}

export function ProjectScorecard({
  projectId,
  signals,
  insights,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
}: ProjectScorecardProps) {
  const t = useTranslations();

  const insightsByType = useMemo(() => {
    const grouped: Record<InsightType, ProjectInsight[]> = {
      strength: [],
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

  const hasContent =
    signals.strengths.length > 0 || signals.threats.length > 0 || insights.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <section className="bg-card flex flex-col gap-5 rounded-lg border p-4 md:p-5">
      <h2 className="text-foreground text-base font-semibold">
        {t('projects.scorecard.title' as MessageKey)}
      </h2>

      <div className="grid gap-6 md:grid-cols-3">
        <ScorecardSection
          title={t('projects.scorecard.strengths' as MessageKey)}
          icon={TrendingUp}
          signals={signals.strengths}
          insights={insightsByType.strength}
          insightType="strength"
          projectId={projectId}
          emptyMessageKey={'projects.scorecard.emptyStrengths' as MessageKey}
          onInsightCreated={onInsightCreated}
          onInsightUpdated={onInsightUpdated}
          onInsightDeleted={onInsightDeleted}
        />

        <ScorecardSection
          title={t('projects.scorecard.threats' as MessageKey)}
          icon={TrendingDown}
          signals={signals.threats}
          insights={insightsByType.threat}
          insightType="threat"
          projectId={projectId}
          emptyMessageKey={'projects.scorecard.emptyThreats' as MessageKey}
          onInsightCreated={onInsightCreated}
          onInsightUpdated={onInsightUpdated}
          onInsightDeleted={onInsightDeleted}
        />

        <ScorecardSection
          title={t('projects.scorecard.decisions' as MessageKey)}
          icon={Compass}
          signals={[]}
          insights={insightsByType.decision}
          insightType="decision"
          projectId={projectId}
          emptyMessageKey={'projects.scorecard.emptyDecisions' as MessageKey}
          onInsightCreated={onInsightCreated}
          onInsightUpdated={onInsightUpdated}
          onInsightDeleted={onInsightDeleted}
        />
      </div>
    </section>
  );
}
