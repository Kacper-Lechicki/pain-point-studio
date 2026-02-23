'use server';

import { cache } from 'react';

import { SIGNAL_THRESHOLDS } from '@/features/projects/config/signals';
import type { PhaseStatus } from '@/features/projects/lib/phase-status';
import type { Project, ProjectContext, ResearchPhase } from '@/features/projects/types';
import { RESEARCH_PHASES } from '@/features/projects/types';
import { createClient } from '@/lib/supabase/server';

export interface ProjectWithMetrics extends Project {
  surveyCount: number;
  responseCount: number;
  /** Fraction of phases validated (0–1) for idea_validation, null for custom. */
  validationProgress: number | null;
  /** Per-phase validation status for idea_validation projects, null for custom. */
  phaseStatuses: Record<ResearchPhase, PhaseStatus> | null;
}

export const getProjects = cache(async (): Promise<ProjectWithMetrics[] | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (projectsError) {
    return null;
  }

  if (!projects || projects.length === 0) {
    return [];
  }

  const projectIds = projects.map((p) => p.id);

  // Fetch surveys with response counts for all user projects in one query
  const { data: surveys } = await supabase
    .from('surveys')
    .select('id, project_id, research_phase, status, survey_responses(count)')
    .in('project_id', projectIds);

  // Build per-project metrics
  const metricsMap = new Map<
    string,
    {
      surveyCount: number;
      responseCount: number;
      phasesWithValidation: Set<string>;
      phasesWithAnySurvey: Set<string>;
    }
  >();

  for (const id of projectIds) {
    metricsMap.set(id, {
      surveyCount: 0,
      responseCount: 0,
      phasesWithValidation: new Set(),
      phasesWithAnySurvey: new Set(),
    });
  }

  if (surveys) {
    for (const survey of surveys) {
      const pid = survey.project_id;

      if (!pid) {
        continue;
      }

      const metrics = metricsMap.get(pid);

      if (!metrics) {
        continue;
      }

      metrics.surveyCount++;

      const respCount =
        Array.isArray(survey.survey_responses) && survey.survey_responses.length > 0
          ? (survey.survey_responses[0] as { count: number }).count
          : 0;

      metrics.responseCount += respCount;

      // Track phases that have any survey assigned
      if (survey.research_phase) {
        metrics.phasesWithAnySurvey.add(survey.research_phase);
      }

      // Track validated phases: completed survey with >= minResponses
      if (
        survey.status === 'completed' &&
        survey.research_phase &&
        respCount >= SIGNAL_THRESHOLDS.minResponses
      ) {
        metrics.phasesWithValidation.add(survey.research_phase);
      }
    }
  }

  return projects.map((project) => {
    const metrics = metricsMap.get(project.id)!;
    const totalPhases = RESEARCH_PHASES.length;

    return {
      ...project,
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
});
