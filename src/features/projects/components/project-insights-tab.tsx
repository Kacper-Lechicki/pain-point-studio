'use client';

import { useCallback, useMemo } from 'react';

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { Compass, Lightbulb, Search, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { HeroHighlight } from '@/components/ui/hero-highlight';
import { createInsight } from '@/features/projects/actions/create-insight';
import { FindingCard, getFindingText } from '@/features/projects/components/finding-card';
import { ScorecardSection } from '@/features/projects/components/scorecard-section';
import type { Finding, InsightType, ProjectInsight } from '@/features/projects/types';
import { INSIGHT_TYPES } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

// ── Scorecard section config ──────────────────────────────────────────

const SCORECARD_SECTIONS: {
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

// ── Droppable insight section ─────────────────────────────────────────

interface DroppableSectionProps {
  insightType: InsightType;
  children: React.ReactNode;
}

function DroppableSection({ insightType, children }: DroppableSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id: insightType });

  return (
    <div ref={setNodeRef} className={cn(isOver && '[&>*]:border-primary/40 [&>*]:bg-primary/5')}>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────

interface ProjectInsightsTabProps {
  projectId: string;
  allFindings: Finding[];
  insights: ProjectInsight[];
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
}

export function ProjectInsightsTab({
  projectId,
  allFindings,
  insights,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
}: ProjectInsightsTabProps) {
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleCategorize = useCallback(
    async (finding: Finding, insightType: InsightType) => {
      const content = getFindingText(finding, t);

      const result = await createInsight({
        projectId,
        type: insightType,
        content,
      });

      if (result && !result.error && result.data) {
        const newInsight: ProjectInsight = {
          id: result.data.insightId,
          project_id: projectId,
          type: insightType,
          content,
          phase: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        onInsightCreated(newInsight);
        toast.success(
          t('projects.findings.addedAs' as MessageKey, {
            type: t(`projects.insightTypes.${insightType}` as MessageKey),
          })
        );
      }
    },
    [projectId, t, onInsightCreated]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) {
        return;
      }

      const insightType = over.id as InsightType;

      if (!INSIGHT_TYPES.includes(insightType)) {
        return;
      }

      const { finding } = active.data.current as { finding: Finding; index: number };

      void handleCategorize(finding, insightType);
    },
    [handleCategorize]
  );

  const totalCount = allFindings.length + insights.length;

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
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-6">
        {/* Findings section */}
        {allFindings.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
              <h3 className="text-foreground text-sm font-medium">
                {t('projects.findings.title' as MessageKey)}
              </h3>
              <span className="text-muted-foreground text-xs">({allFindings.length})</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {allFindings.map((finding, i) => (
                <FindingCard
                  key={`${finding.source}-${finding.questionText ?? i}`}
                  finding={finding}
                  index={i}
                  onCategorize={(insightType) => void handleCategorize(finding, insightType)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Insight categories -- 2x2 grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {SCORECARD_SECTIONS.map((section) => (
            <DroppableSection key={section.type} insightType={section.type}>
              <ScorecardSection
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
            </DroppableSection>
          ))}
        </div>
      </div>
    </DndContext>
  );
}
