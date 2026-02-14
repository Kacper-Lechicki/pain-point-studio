'use server';

import { cache } from 'react';

import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

import type { SurveyStatus } from '../types';

export interface UserSurvey {
  id: string;
  title: string;
  description: string;
  category: string;
  status: SurveyStatus;
  slug: string | null;
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
  createdAt: string;
  updatedAt: string;
}

const userSurveySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  status: z.string(),
  slug: z.string().nullable(),
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
  createdAt: z.string(),
  updatedAt: z.string(),
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
