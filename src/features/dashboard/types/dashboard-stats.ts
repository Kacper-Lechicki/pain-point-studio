export interface TimelinePoint {
  date: string;
  count: number;
}

export interface CompletionPoint {
  date: string;
  rate: number;
}

export interface ActivityItem {
  type: 'response' | 'survey_completed' | 'survey_activated';
  title: string;
  timestamp: string;
  surveyId: string;
}

export interface DashboardStats {
  totalResponses: number;
  prevTotalResponses: number | null;
  activeSurveys: number;
  prevActiveSurveys: number | null;
  avgCompletionRate: number;
  prevAvgCompletionRate: number | null;
  responsesTimeline: TimelinePoint[];
  completionTimeline: CompletionPoint[];
  recentActivity: ActivityItem[];
}
