'use server';

import { cache } from 'react';

// Re-uses the same Zod schema from getUserSurveys since the RPC shape is identical.
// We import it indirectly to avoid coupling — the schema is inline here for the same shape.
import { z } from 'zod';

import { type UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { createClient } from '@/lib/supabase/server';

const userSurveySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  slug: z.string().nullable(),
  viewCount: z.number().default(0),
  responseCount: z.number(),
  completedCount: z.number(),
  questionCount: z.number(),
  recentActivity: z.array(z.number()),
  lastResponseAt: z.string().nullable(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  maxRespondents: z.number().nullable(),
  archivedAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  avgCompletionSeconds: z.number().nullable(),
  avgQuestionCompletion: z.number().nullable(),
  projectId: z.string(),
  projectName: z.string(),
  researchPhase: z.string().nullable().optional().default(null),
  deletedAt: z.string().nullable().optional().default(null),
  preTrashStatus: z.string().nullable().optional().default(null),
  previousStatus: z.string().nullable().optional().default(null),
});

const projectSurveysRpcSchema = z.array(userSurveySchema);

export const getProjectSurveys = cache(async (projectId: string): Promise<UserSurvey[] | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_project_surveys_with_counts', {
    p_user_id: user.id,
    p_project_id: projectId,
  });

  if (error) {
    return null;
  }

  if (!data) {
    return [];
  }

  const parsed = projectSurveysRpcSchema.safeParse(data);

  return parsed.success ? (parsed.data as UserSurvey[]) : null;
});
