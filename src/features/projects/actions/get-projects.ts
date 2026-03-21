'use server';

import { cache } from 'react';

import type { ProjectWithMetrics } from '@/features/projects/types';
import { getAuthenticatedClient } from '@/lib/supabase/get-authenticated-client';

export type { ProjectWithMetrics } from '@/features/projects/types';

export const getProjects = cache(async (): Promise<ProjectWithMetrics[] | null> => {
  const { user, supabase } = await getAuthenticatedClient();

  if (!user) {
    return null;
  }

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'trashed')
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
    .select('id, project_id, status, survey_responses(count)')
    .in('project_id', projectIds);

  // Build per-project metrics
  const metricsMap = new Map<
    string,
    {
      surveyCount: number;
      activeSurveyCount: number;
      responseCount: number;
    }
  >();

  for (const id of projectIds) {
    metricsMap.set(id, {
      surveyCount: 0,
      activeSurveyCount: 0,
      responseCount: 0,
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

      if (survey.status === 'active') {
        metrics.activeSurveyCount++;
      }

      const respCount =
        Array.isArray(survey.survey_responses) && survey.survey_responses.length > 0
          ? (survey.survey_responses[0] as { count: number }).count
          : 0;

      metrics.responseCount += respCount;
    }
  }

  return projects.map((project) => {
    const metrics = metricsMap.get(project.id)!;

    return {
      ...project,
      surveyCount: metrics.surveyCount,
      activeSurveyCount: metrics.activeSurveyCount,
      responseCount: metrics.responseCount,
    };
  });
});
