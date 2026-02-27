'use server';

import { cache } from 'react';

import { z } from 'zod';

import type { ProjectOverviewStats } from '@/features/projects/types';
import { createClient } from '@/lib/supabase/server';

const activityItemSchema = z.object({
  type: z.enum(['response', 'survey_completed', 'survey_activated']),
  title: z.string(),
  timestamp: z.string(),
  surveyId: z.string(),
});

const timelinePointSchema = z.object({
  date: z.string(),
  count: z.number(),
});

const surveyStatusDistributionSchema = z.object({
  draft: z.number(),
  active: z.number(),
  completed: z.number(),
});

const completionBreakdownSchema = z.object({
  completed: z.number(),
  inProgress: z.number(),
  abandoned: z.number(),
});

const projectOverviewStatsSchema = z.object({
  totalSurveys: z.number(),
  activeSurveys: z.number(),
  totalResponses: z.number(),
  avgCompletion: z.number(),
  avgTimeSeconds: z.number().nullable(),
  lastResponseAt: z.string().nullable(),
  recentActivity: z.array(activityItemSchema),
  responsesTimeline: z.array(timelinePointSchema),
  surveyStatusDistribution: surveyStatusDistributionSchema,
  completionBreakdown: completionBreakdownSchema,
});

/**
 * Fetch project-scoped overview statistics via get_project_detail_stats RPC.
 * Returns null when unauthenticated, on RPC error, or when the response fails validation.
 * Wrapped with React `cache()` for per-request deduplication.
 */
export const getProjectOverviewStats = cache(
  async (projectId: string): Promise<ProjectOverviewStats | null> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase.rpc('get_project_detail_stats', {
      p_project_id: projectId,
      p_user_id: user.id,
    });

    if (error || !data) {
      return null;
    }

    const parsed = projectOverviewStatsSchema.safeParse(data);

    if (!parsed.success) {
      return null;
    }

    return parsed.data;
  }
);
