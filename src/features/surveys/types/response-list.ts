import type { QuestionType } from '@/features/surveys/types';

export type ResponseStatus = 'in_progress' | 'completed' | 'abandoned';
export type DeviceType = 'desktop' | 'mobile' | 'tablet';

export interface SurveyResponseListItem {
  id: string;
  status: ResponseStatus;
  startedAt: string;
  completedAt: string | null;
  deviceType: DeviceType | null;
  durationSeconds: number | null;
  contactName: string | null;
  contactEmail: string | null;
  answerCount: number;
  feedback: string | null;
}

export interface ResponseAnswer {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  questionConfig: Record<string, unknown>;
  sortOrder: number;
  value: Record<string, unknown>;
}

export interface ResponseDetail extends SurveyResponseListItem {
  answers: ResponseAnswer[];
}

export type ResponseSortBy = 'completed_at' | 'started_at' | 'duration';
export type SortDirection = 'asc' | 'desc';

export interface ResponseListFilters {
  status?: ResponseStatus | undefined;
  device?: DeviceType | undefined;
  hasContact?: boolean | undefined;
  search?: string | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  sortBy: ResponseSortBy;
  sortDir: SortDirection;
  page: number;
  perPage: number;
}

export const DEFAULT_RESPONSE_FILTERS: ResponseListFilters = {
  sortBy: 'completed_at',
  sortDir: 'desc',
  page: 1,
  perPage: 10,
};
