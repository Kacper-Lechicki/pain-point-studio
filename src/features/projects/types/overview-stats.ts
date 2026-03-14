import { z } from 'zod';

import type {
  ActivityItem,
  CompletionBreakdown,
  SurveyStatusDistribution,
  TimelinePoint,
} from '@/lib/common/analytics';

export type { ActivityItem, CompletionBreakdown, SurveyStatusDistribution, TimelinePoint };

export interface ProjectOverviewStats {
  totalSurveys: number;
  activeSurveys: number;
  totalResponses: number;
  avgCompletion: number;
  avgTimeSeconds: number | null;
  lastResponseAt: string | null;
  recentActivity: ActivityItem[];
  responsesTimeline: TimelinePoint[];
  surveyStatusDistribution: SurveyStatusDistribution;
  completionBreakdown: CompletionBreakdown;
}

const activityItemSchema = z.object({
  type: z.enum(['response', 'survey_completed', 'survey_activated', 'survey_started']),
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
  cancelled: z.number().default(0),
  archived: z.number().default(0),
});

const completionBreakdownSchema = z.object({
  completed: z.number(),
  inProgress: z.number(),
  abandoned: z.number(),
});

export const projectOverviewStatsSchema = z.object({
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
