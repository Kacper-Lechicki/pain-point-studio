'use client';

import {
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { KpiCard } from '@/features/dashboard/components/bento/kpi-card';
import type { ProjectSurvey } from '@/features/projects/actions/get-project';
import type { ProjectInsight, Signal } from '@/features/projects/types';

interface ProjectDetailKpiProps {
  surveys: ProjectSurvey[];
  totalResponses: number;
  scorecardSignals: { strengths: Signal[]; threats: Signal[] };
  insights: ProjectInsight[];
  isIdeaValidation: boolean;
}

export function ProjectDetailKpi({
  surveys,
  totalResponses,
  scorecardSignals,
  insights,
  isIdeaValidation,
}: ProjectDetailKpiProps) {
  const t = useTranslations();

  const completedSurveys = surveys.filter(
    (s) => s.status === 'completed' || s.status === 'closed'
  ).length;
  const completionPct =
    surveys.length > 0 ? Math.round((completedSurveys / surveys.length) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiCard
        title={t('projects.detail.kpi.surveys')}
        value={String(surveys.length)}
        delta={null}
        icon={ClipboardList}
        accent="cyan"
      />

      <KpiCard
        title={t('projects.detail.kpi.responses')}
        value={String(totalResponses)}
        delta={null}
        icon={Users}
        accent="violet"
      />

      {isIdeaValidation ? (
        <>
          <KpiCard
            title={t('projects.detail.kpi.strengths')}
            value={String(scorecardSignals.strengths.length)}
            delta={null}
            icon={TrendingUp}
            accent="emerald"
          />
          <KpiCard
            title={t('projects.detail.kpi.threats')}
            value={String(scorecardSignals.threats.length)}
            delta={null}
            icon={TrendingDown}
            accent="rose"
          />
        </>
      ) : (
        <>
          <KpiCard
            title={t('projects.detail.kpi.insights')}
            value={String(insights.length)}
            delta={null}
            icon={Lightbulb}
            accent="pink"
          />
          <KpiCard
            title={t('projects.detail.kpi.completion')}
            value={`${completionPct}%`}
            delta={null}
            icon={CheckCircle2}
            subtitle={t('projects.detail.kpi.completionSubtitle', {
              completed: completedSurveys,
              total: surveys.length,
            })}
          />
        </>
      )}
    </div>
  );
}
