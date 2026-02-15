'use server';

import { cache } from 'react';

import { z } from 'zod';

import { SURVEY_STATUSES } from '@/features/surveys/types';
import { createClient } from '@/lib/supabase/server';

// ── Validation schema for the get_analytics_data RPC response ───────

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
        status: z.enum(SURVEY_STATUSES),
        category: z.string(),
        completedCount: z.number(),
        completionRate: z.number(),
        questionCount: z.number(),
        createdAt: z.string(),
      })
    )
    .default([]),
});

/** Aggregated analytics derived from the user's surveys and responses. */
export type AnalyticsData = z.infer<typeof analyticsDataSchema>;

// ── Cached server action ────────────────────────────────────────────

/** Fetches aggregated analytics for the authenticated user via Supabase RPC. */
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
