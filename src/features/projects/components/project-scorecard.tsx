'use client';

import { useMemo } from 'react';

import { Compass, Lightbulb, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ScorecardSection } from '@/features/projects/components/scorecard-section';
import type { InsightType, ProjectInsight } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';

interface ProjectScorecardProps {
  projectId: string;
  insights: ProjectInsight[];
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
}

const SECTIONS: {
  type: InsightType;
  titleKey: string;
  emptyKey: string;
  icon: typeof TrendingUp;
}[] = [
  {
    type: 'strength',
    titleKey: 'projects.scorecard.strengths',
    emptyKey: 'projects.scorecard.emptyStrengths',
    icon: TrendingUp,
  },
  {
    type: 'opportunity',
    titleKey: 'projects.scorecard.opportunities',
    emptyKey: 'projects.scorecard.emptyOpportunities',
    icon: Lightbulb,
  },
  {
    type: 'threat',
    titleKey: 'projects.scorecard.threats',
    emptyKey: 'projects.scorecard.emptyThreats',
    icon: TrendingDown,
  },
  {
    type: 'decision',
    titleKey: 'projects.scorecard.decisions',
    emptyKey: 'projects.scorecard.emptyDecisions',
    icon: Compass,
  },
];

export function ProjectScorecard({
  projectId,
  insights,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
}: ProjectScorecardProps) {
  const t = useTranslations();

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

  if (insights.length === 0) {
    return null;
  }

  return (
    <section className="bg-card flex flex-col gap-5 rounded-lg border p-4 md:p-5">
      <h2 className="text-foreground text-base font-semibold">
        {t('projects.scorecard.title' as MessageKey)}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <ScorecardSection
            key={section.type}
            title={t(section.titleKey as MessageKey)}
            icon={section.icon}
            insights={insightsByType[section.type]}
            insightType={section.type}
            projectId={projectId}
            emptyMessageKey={section.emptyKey as MessageKey}
            onInsightCreated={onInsightCreated}
            onInsightUpdated={onInsightUpdated}
            onInsightDeleted={onInsightDeleted}
          />
        ))}
      </div>
    </section>
  );
}
