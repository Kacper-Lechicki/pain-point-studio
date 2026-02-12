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
