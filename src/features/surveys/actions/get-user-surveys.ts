'use server';

import { cache } from 'react';

import { z } from 'zod';

import { type SurveyStatus } from '@/features/surveys/types';
import { createClient } from '@/lib/supabase/server';

export interface UserSurvey {
  id: string;
  title: string;
  description: string;
  status: SurveyStatus;
  slug: string | null;
  /** Total page views (incremented on each page load of the respondent page). */
  viewCount: number;
  responseCount: number;
  completedCount: number;
  questionCount: number;
  /** 14-element array of daily response counts (newest last). */
  recentActivity: number[];
  /** ISO timestamp of the most recent response, or null. */
  lastResponseAt: string | null;
  /** Scheduled start date, or null if immediate. */
  startsAt: string | null;
  /** Scheduled end date, or null if no limit. */
  endsAt: string | null;
  /** Max respondent cap, or null if unlimited. */
  maxRespondents: number | null;
  /** When the survey was archived, or null. */
  archivedAt: string | null;
  /** When the survey was cancelled, or null. */
  cancelledAt: string | null;
  /** When the survey was completed, or null. */
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Average completion time in seconds for completed responses, or null. */
  avgCompletionSeconds: number | null;
  /** Average question completion percentage across completed responses, or null. */
  avgQuestionCompletion: number | null;
  /** Linked project ID, or null if standalone. */
  projectId: string | null;
  /** Research phase within the project, or null. */
  researchPhase: string | null;
  /** Project name (denormalized for display), or null. */
  projectName: string | null;
  /** Project context ('idea_validation' | 'custom'), or null. */
  projectContext: string | null;
}

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
  projectId: z.string().nullable().optional().default(null),
  researchPhase: z.string().nullable().optional().default(null),
  projectName: z.string().nullable().optional().default(null),
  projectContext: z.string().nullable().optional().default(null),
});

const userSurveysRpcSchema = z.array(userSurveySchema);

export const getUserSurveys = cache(async (): Promise<UserSurvey[] | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_user_surveys_with_counts', {
    p_user_id: user.id,
  });

  if (error) {
    return null;
  }

  if (!data) {
    return [];
  }

  const parsed = userSurveysRpcSchema.safeParse(data);

  return parsed.success ? (parsed.data as UserSurvey[]) : null;
});
