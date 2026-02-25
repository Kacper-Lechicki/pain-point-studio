'use server';

import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

// ── Types ────────────────────────────────────────────────────────────

export interface OverviewProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  updatedAt: string;
  surveyCount: number;
  responseCount: number;
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
      .select('id, project_id, status, survey_responses(count)')
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
    }
  >();

  for (const id of projectIds) {
    projectMetricsMap.set(id, {
      surveyCount: 0,
      responseCount: 0,
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
  }

  const overviewProjects: OverviewProject[] = projects.map((project) => {
    const metrics = projectMetricsMap.get(project.id)!;

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      updatedAt: project.updated_at,
      surveyCount: metrics.surveyCount,
      responseCount: metrics.responseCount,
    };
  });

  return { projects: overviewProjects };
});
