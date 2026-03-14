import type { Project } from '@/features/projects/types';

export interface ProjectWithMetrics extends Project {
  surveyCount: number;
  activeSurveyCount: number;
  responseCount: number;
}
