'use server';

import { cache } from 'react';

import { z } from 'zod';

import type { DashboardStats } from '@/features/dashboard/types/dashboard-stats';
import { createClient } from '@/lib/supabase/server';

// -- Validation schema for the get_dashboard_stats RPC response ---

const timelinePointSchema = z.object({
  date: z.string(),
  count: z.number(),
});

const completionPointSchema = z.object({
  date: z.string(),
  rate: z.number(),
});

const activityItemSchema = z.object({
  type: z.enum(['response', 'survey_completed', 'survey_activated']),
  title: z.string(),
  timestamp: z.string(),
  surveyId: z.string(),
});

const dashboardStatsSchema = z.object({
  totalResponses: z.number(),
  prevTotalResponses: z.number().nullable(),
  activeSurveys: z.number(),
  prevActiveSurveys: z.number().nullable(),
  avgCompletionRate: z.number(),
  prevAvgCompletionRate: z.number().nullable(),
  responsesTimeline: z.array(timelinePointSchema),
  completionTimeline: z.array(completionPointSchema),
  recentActivity: z.array(activityItemSchema),
});

/**
 * Fetch dashboard statistics via get_dashboard_stats RPC.
 * Returns null when unauthenticated, on RPC error, or when the response fails validation.
 * Wrapped with React `cache()` for per-request deduplication.
 */
export const getDashboardStats = cache(async (days: number): Promise<DashboardStats | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_dashboard_stats', {
    p_user_id: user.id,
    p_days: days,
  });

  if (error || !data) {
    return null;
  }

  const parsed = dashboardStatsSchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
});
