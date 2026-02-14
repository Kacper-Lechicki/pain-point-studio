'use server';

import { cache } from 'react';

import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

export interface DashboardOverview {
  totalSurveys: number;
  activeSurveys: number;
  totalResponses: number;
  completedResponses: number;
  avgCompletionRate: number;
  responseTimeline: number[];
  topSurveys: {
    id: string;
    title: string;
    status: string;
    completedCount: number;
    slug: string | null;
  }[];
  recentResponses: {
    surveyId: string;
    surveyTitle: string;
    completedAt: string;
    feedback: string | null;
  }[];
}

const dashboardOverviewSchema = z.object({
  totalSurveys: z.number(),
  activeSurveys: z.number(),
  totalResponses: z.number(),
  completedResponses: z.number(),
  avgCompletionRate: z.number(),
  responseTimeline: z.array(z.number()).default([]),
  topSurveys: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        status: z.string(),
        completedCount: z.number(),
        slug: z.string().nullable(),
      })
    )
    .default([]),
  recentResponses: z
    .array(
      z.object({
        surveyId: z.string(),
        surveyTitle: z.string(),
        completedAt: z.string(),
        feedback: z.string().nullable(),
      })
    )
    .default([]),
});

export const getDashboardOverview = cache(async (): Promise<DashboardOverview | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_dashboard_overview', {
    p_user_id: user.id,
  });

  if (error || !data) {
    return null;
  }

  const parsed = dashboardOverviewSchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
});
