'use client';

import { useMemo } from 'react';

import { Compass, Lightbulb, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { HeroHighlight } from '@/components/ui/hero-highlight';
import { ScorecardSection } from '@/features/projects/components/scorecard-section';
import type { InsightType, ProjectInsight, Signal } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';

interface ProjectInsightsTabProps {
  projectId: string;
  signalsByPhase: Record<string, Signal[]>;
  insights: ProjectInsight[];
  isIdeaValidation: boolean;
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
}

export function ProjectInsightsTab({
  projectId,
  signalsByPhase,
  insights,
  isIdeaValidation,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
}: ProjectInsightsTabProps) {
  const t = useTranslations();

  const allSignals = useMemo(() => {
    if (!isIdeaValidation) {
      return { strengths: [], threats: [] };
    }

    const all = Object.values(signalsByPhase).flat();

    return {
      strengths: all.filter((s) => s.type === 'strength'),
      threats: all.filter((s) => s.type === 'threat' && s.source !== 'no_data'),
    };
  }, [isIdeaValidation, signalsByPhase]);

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

  const totalCount = allSignals.strengths.length + allSignals.threats.length + insights.length;

  if (totalCount === 0) {
    return (
      <HeroHighlight
        showDotsOnMobile={false}
        containerClassName="w-full rounded-lg border border-dashed border-border"
      >
        <div className="flex w-full flex-col items-center px-4 py-12 text-center md:py-16">
          <Lightbulb className="text-muted-foreground size-8" aria-hidden />
          <p className="text-foreground mt-3 text-base font-medium">
            {t('projects.detail.empty.noInsightsTitle')}
          </p>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            {t('projects.detail.empty.noInsightsDescription')}
          </p>
        </div>
      </HeroHighlight>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <ScorecardSection
        title={t('projects.scorecard.strengths' as MessageKey)}
        icon={TrendingUp}
        signals={allSignals.strengths}
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
        signals={allSignals.threats}
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
  );
}
