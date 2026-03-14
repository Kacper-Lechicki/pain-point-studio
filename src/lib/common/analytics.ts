export interface TimelinePoint {
  date: string;
  count: number;
}

export interface ActivityItem {
  type: 'response' | 'survey_completed' | 'survey_activated' | 'survey_started';
  title: string;
  timestamp: string;
  surveyId: string;
}

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
