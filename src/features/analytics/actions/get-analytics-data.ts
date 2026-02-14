'use server';

import { cache } from 'react';

import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

export interface AnalyticsData {
  responseTimeline: number[];
  totalResponses: number;
  completedResponses: number;
  avgCompletionRate: number;
  categoryBreakdown: {
    category: string;
    count: number;
    totalResponses: number;
  }[];
  surveyComparison: {
    id: string;
    title: string;
    status: string;
    category: string;
    completedCount: number;
    completionRate: number;
    questionCount: number;
    createdAt: string;
  }[];
}

const analyticsDataSchema = z.object({
  responseTimeline: z.array(z.number()).default([]),
  totalResponses: z.number(),
  completedResponses: z.number(),
  avgCompletionRate: z.number(),
  categoryBreakdown: z
    .array(
      z.object({
        category: z.string(),
        count: z.number(),
        totalResponses: z.number(),
      })
    )
    .default([]),
  surveyComparison: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        status: z.string(),
        category: z.string(),
        completedCount: z.number(),
        completionRate: z.number(),
        questionCount: z.number(),
        createdAt: z.string(),
      })
    )
    .default([]),
});

export const getAnalyticsData = cache(async (): Promise<AnalyticsData | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_analytics_data', {
    p_user_id: user.id,
  });

  if (error || !data) {
    return null;
  }

  const parsed = analyticsDataSchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
});
