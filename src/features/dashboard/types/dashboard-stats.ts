import { z } from 'zod';

import type { ActivityItem, CompletionTimelinePoint, TimelinePoint } from '@/lib/common/analytics';

export type { ActivityItem, CompletionTimelinePoint, TimelinePoint };

export interface DashboardStats {
  totalResponses: number;
  prevTotalResponses: number | null;
  activeSurveys: number;
  prevActiveSurveys: number | null;
  avgCompletionRate: number;
  prevAvgCompletionRate: number | null;
  responsesTimeline: TimelinePoint[];
  completionTimeline: CompletionTimelinePoint[];
  recentActivity: ActivityItem[];
}

const timelinePointSchema = z.object({
  date: z.string(),
  count: z.number(),
});

const completionTimelinePointSchema = z.object({
  date: z.string(),
  completed: z.number(),
  inProgress: z.number(),
  abandoned: z.number(),
});

const activityItemSchema = z.object({
  type: z.enum(['response', 'survey_completed', 'survey_activated']),
  title: z.string(),
  timestamp: z.string(),
  surveyId: z.string(),
});

export const dashboardStatsSchema = z.object({
  totalResponses: z.number(),
  prevTotalResponses: z.number().nullable(),
  activeSurveys: z.number(),
  prevActiveSurveys: z.number().nullable(),
  avgCompletionRate: z.number(),
  prevAvgCompletionRate: z.number().nullable(),
  responsesTimeline: z.array(timelinePointSchema),
  completionTimeline: z.array(completionTimelinePointSchema).default([]),
  recentActivity: z.array(activityItemSchema),
});
