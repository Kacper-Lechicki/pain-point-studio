'use server';

import { cache } from 'react';

import { SIGNAL_THRESHOLDS } from '@/features/projects/config/signals';
import type { PhaseStatus } from '@/features/projects/lib/phase-status';
import type { ProjectContext, ResearchPhase } from '@/features/projects/types';
import { RESEARCH_PHASES } from '@/features/projects/types';
import type { SurveyStatus } from '@/features/surveys/types';
import { createClient } from '@/lib/supabase/server';

// ── Types ────────────────────────────────────────────────────────────

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
}

export interface OverviewSurvey {
  id: string;
  title: string;
  status: SurveyStatus;
  responseCount: number;
  updatedAt: string;
  projectId: string | null;
  projectName: string | null;
}

export interface DashboardOverview {
  stats: {
    totalProjects: number;
    totalSurveys: number;
    totalResponses: number;
  };
  recentProjects: OverviewProject[];
  recentSurveys: OverviewSurvey[];
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

  // Run all queries in parallel for speed
  const [projectsResult, surveysResult, allProjectSurveysResult] = await Promise.all([
    // Recent active projects (max 3)
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(3),

    // Recent non-archived surveys (max 5)
    supabase
      .from('surveys')
      .select('id, title, status, updated_at, project_id, survey_responses(count)')
      .eq('user_id', user.id)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(5),

    // All surveys for stat counts + project metrics (lightweight: only IDs and counts)
    supabase
      .from('surveys')
      .select('id, project_id, research_phase, status, survey_responses(count)')
      .eq('user_id', user.id),
  ]);

  // Total projects count (separate lightweight query)
  const { count: totalProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const projects = projectsResult.data ?? [];
  const surveys = surveysResult.data ?? [];
  const allSurveys = allProjectSurveysResult.data ?? [];

  // ── Compute stats ──────────────────────────────────────────────────

  let totalResponses = 0;

  for (const survey of allSurveys) {
    const respCount =
      Array.isArray(survey.survey_responses) && survey.survey_responses.length > 0
        ? (survey.survey_responses[0] as { count: number }).count
        : 0;

    totalResponses += respCount;
  }

  // ── Compute project metrics ────────────────────────────────────────

  const projectIds = projects.map((p) => p.id);
  const projectMetricsMap = new Map<
    string,
    {
      surveyCount: number;
      responseCount: number;
      phasesWithValidation: Set<string>;
      phasesWithAnySurvey: Set<string>;
    }
  >();

  for (const id of projectIds) {
    projectMetricsMap.set(id, {
      surveyCount: 0,
      responseCount: 0,
      phasesWithValidation: new Set(),
      phasesWithAnySurvey: new Set(),
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
    }

    if (
      survey.status === 'completed' &&
      survey.research_phase &&
      respCount >= SIGNAL_THRESHOLDS.minResponses
    ) {
      metrics.phasesWithValidation.add(survey.research_phase);
    }
  }

  const recentProjects: OverviewProject[] = projects.map((project) => {
    const metrics = projectMetricsMap.get(project.id)!;
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
      validationProgress:
        (project.context as ProjectContext) === 'idea_validation'
          ? metrics.phasesWithValidation.size / totalPhases
          : null,
      phaseStatuses:
        (project.context as ProjectContext) === 'idea_validation'
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
    };
  });

  // ── Map recent surveys ─────────────────────────────────────────────

  // Build project name lookup from recent projects (and all surveys with project_ids)
  const projectNameMap = new Map<string, string>();

  for (const p of projects) {
    projectNameMap.set(p.id, p.name);
  }

  // For surveys linked to projects not in the top 3, fetch those project names
  const missingProjectIds = surveys
    .filter((s) => s.project_id && !projectNameMap.has(s.project_id))
    .map((s) => s.project_id!);

  if (missingProjectIds.length > 0) {
    const { data: extraProjects } = await supabase
      .from('projects')
      .select('id, name')
      .in('id', missingProjectIds);

    for (const p of extraProjects ?? []) {
      projectNameMap.set(p.id, p.name);
    }
  }

  const recentSurveys: OverviewSurvey[] = surveys.map((survey) => {
    const respCount =
      Array.isArray(survey.survey_responses) && survey.survey_responses.length > 0
        ? (survey.survey_responses[0] as { count: number }).count
        : 0;

    return {
      id: survey.id,
      title: survey.title,
      status: survey.status as SurveyStatus,
      responseCount: respCount,
      updatedAt: survey.updated_at,
      projectId: survey.project_id,
      projectName: survey.project_id ? (projectNameMap.get(survey.project_id) ?? null) : null,
    };
  });

  return {
    stats: {
      totalProjects: totalProjects ?? 0,
      totalSurveys: allSurveys.length,
      totalResponses,
    },
    recentProjects,
    recentSurveys,
  };
});
