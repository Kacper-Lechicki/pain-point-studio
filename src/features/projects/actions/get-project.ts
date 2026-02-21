'use server';

import { cache } from 'react';

import type { Project } from '@/features/projects/types';
import { createClient } from '@/lib/supabase/server';

export interface ProjectSurvey {
  id: string;
  title: string;
  status: string;
  researchPhase: string | null;
  responseCount: number;
  completedCount: number;
  createdAt: string;
}

export interface ProjectDetail {
  project: Project;
  surveys: ProjectSurvey[];
  surveysByPhase: Record<string, ProjectSurvey[]>;
}

export const getProject = cache(async (projectId: string): Promise<ProjectDetail | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle();

  if (projectError || !project) {
    return null;
  }

  const { data: rawSurveys } = await supabase
    .from('surveys')
    .select('id, title, status, research_phase, created_at, survey_responses(count)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  const surveys: ProjectSurvey[] = (rawSurveys ?? []).map((s) => {
    const respCount =
      Array.isArray(s.survey_responses) && s.survey_responses.length > 0
        ? (s.survey_responses[0] as { count: number }).count
        : 0;

    return {
      id: s.id,
      title: s.title,
      status: s.status,
      researchPhase: s.research_phase,
      responseCount: respCount,
      completedCount: respCount,
      createdAt: s.created_at,
    };
  });

  const surveysByPhase: Record<string, ProjectSurvey[]> = {};

  for (const survey of surveys) {
    const phase = survey.researchPhase ?? 'unassigned';

    if (!surveysByPhase[phase]) {
      surveysByPhase[phase] = [];
    }

    surveysByPhase[phase].push(survey);
  }

  return { project, surveys, surveysByPhase };
});
