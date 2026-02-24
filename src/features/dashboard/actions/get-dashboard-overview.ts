'use server';

import { cache } from 'react';

import { SIGNAL_THRESHOLDS } from '@/features/projects/config/signals';
import type { PhaseStatus } from '@/features/projects/lib/phase-status';
import type { ProjectContext, ResearchPhase } from '@/features/projects/types';
import { RESEARCH_PHASES } from '@/features/projects/types';
import { createClient } from '@/lib/supabase/server';

// ── Types ────────────────────────────────────────────────────────────

export interface PhaseMetrics {
  surveyCount: number;
  responseCount: number;
}

export interface OverviewProject {
  id: string;
  name: string;
  description: string | null;
  context: string;
  status: string;
  updatedAt: string;
  surveyCount: number;
  responseCount: number;
  validationProgress: number | null;
  phaseStatuses: Record<ResearchPhase, PhaseStatus> | null;
  phaseMetrics: Record<ResearchPhase, PhaseMetrics> | null;
}

export interface DashboardOverview {
  projects: OverviewProject[];
}

// ── Action ───────────────────────────────────────────────────────────

export const getDashboardOverview = cache(async (): Promise<DashboardOverview | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Run both queries in parallel
  const [projectsResult, allSurveysResult] = await Promise.all([
    // All active projects
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false }),

    // All surveys for project metrics (lightweight: only IDs and counts)
    supabase
      .from('surveys')
      .select('id, project_id, research_phase, status, survey_responses(count)')
      .eq('user_id', user.id),
  ]);

  const projects = projectsResult.data ?? [];
  const allSurveys = allSurveysResult.data ?? [];

  // ── Compute project metrics ────────────────────────────────────────

  const projectIds = projects.map((p) => p.id);
  const projectMetricsMap = new Map<
    string,
    {
      surveyCount: number;
      responseCount: number;
      phasesWithValidation: Set<string>;
      phasesWithAnySurvey: Set<string>;
      phaseMetrics: Map<string, PhaseMetrics>;
    }
  >();

  for (const id of projectIds) {
    projectMetricsMap.set(id, {
      surveyCount: 0,
      responseCount: 0,
      phasesWithValidation: new Set(),
      phasesWithAnySurvey: new Set(),
      phaseMetrics: new Map(),
    });
  }

  for (const survey of allSurveys) {
    const pid = survey.project_id;

    if (!pid || !projectMetricsMap.has(pid)) {
      continue;
    }

    const metrics = projectMetricsMap.get(pid)!;

    metrics.surveyCount++;

    const respCount =
      Array.isArray(survey.survey_responses) && survey.survey_responses.length > 0
        ? (survey.survey_responses[0] as { count: number }).count
        : 0;

    metrics.responseCount += respCount;

    if (survey.research_phase) {
      metrics.phasesWithAnySurvey.add(survey.research_phase);

      // Accumulate per-phase metrics
      const pm = metrics.phaseMetrics.get(survey.research_phase) ?? {
        surveyCount: 0,
        responseCount: 0,
      };

      pm.surveyCount++;
      pm.responseCount += respCount;
      metrics.phaseMetrics.set(survey.research_phase, pm);
    }

    if (
      survey.status === 'completed' &&
      survey.research_phase &&
      respCount >= SIGNAL_THRESHOLDS.minResponses
    ) {
      metrics.phasesWithValidation.add(survey.research_phase);
    }
  }

  const overviewProjects: OverviewProject[] = projects.map((project) => {
    const metrics = projectMetricsMap.get(project.id)!;
    const isIdeaValidation = (project.context as ProjectContext) === 'idea_validation';
    const totalPhases = RESEARCH_PHASES.length;

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      context: project.context,
      status: project.status,
      updatedAt: project.updated_at,
      surveyCount: metrics.surveyCount,
      responseCount: metrics.responseCount,
      validationProgress: isIdeaValidation ? metrics.phasesWithValidation.size / totalPhases : null,
      phaseStatuses: isIdeaValidation
        ? (Object.fromEntries(
            RESEARCH_PHASES.map((phase) => [
              phase,
              metrics.phasesWithValidation.has(phase)
                ? 'validated'
                : metrics.phasesWithAnySurvey.has(phase)
                  ? 'in_progress'
                  : 'not_started',
            ])
          ) as Record<ResearchPhase, PhaseStatus>)
        : null,
      phaseMetrics: isIdeaValidation
        ? (Object.fromEntries(
            RESEARCH_PHASES.map((phase) => [
              phase,
              metrics.phaseMetrics.get(phase) ?? { surveyCount: 0, responseCount: 0 },
            ])
          ) as Record<ResearchPhase, PhaseMetrics>)
        : null,
    };
  });

  return { projects: overviewProjects };
});
