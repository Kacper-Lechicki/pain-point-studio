import type { ActivityItem, TimelinePoint } from '@/features/dashboard/types/dashboard-stats';

export interface CompletionTimelinePoint {
  date: string;
  completed: number;
  inProgress: number;
  abandoned: number;
}

export interface SurveyStatusDistribution {
  draft: number;
  active: number;
  completed: number;
  cancelled: number;
  archived: number;
}

export interface CompletionBreakdown {
  completed: number;
  inProgress: number;
  abandoned: number;
}

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
