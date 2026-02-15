'use server';

import { cache } from 'react';

import { z } from 'zod';

import { SURVEY_STATUSES } from '@/features/surveys/types';
import { createClient } from '@/lib/supabase/server';

// ── Validation schema for the get_dashboard_overview RPC response ────

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
        status: z.enum(SURVEY_STATUSES),
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

/** Dashboard overview data: KPIs, top surveys, and recent responses. */
export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;

/**
 * Fetch dashboard overview KPIs via get_dashboard_overview RPC.
 * Returns null when unauthenticated, on RPC error, or when the response fails validation.
 * Wrapped with React `cache()` for per-request deduplication.
 */
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
