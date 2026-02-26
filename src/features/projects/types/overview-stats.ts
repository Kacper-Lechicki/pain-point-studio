import type { ActivityItem, TimelinePoint } from '@/features/dashboard/types/dashboard-stats';

export interface ProjectOverviewStats {
  totalSurveys: number;
  activeSurveys: number;
  totalResponses: number;
  avgCompletion: number;
  avgTimeSeconds: number | null;
  lastResponseAt: string | null;
  responsesTimeline: TimelinePoint[];
  surveyStatusDistribution: Record<string, number>;
  completionBreakdown: {
    completed: number;
    inProgress: number;
    abandoned: number;
  };
  recentActivity: ActivityItem[];
}
