/**
 * Provider-agnostic database interface. Wraps RPC calls and table operations.
 * Implemented by Supabase PostgREST (or any future ORM / raw SQL driver).
 */
import type { Json } from './types';

// ── Common types ────────────────────────────────────────────────────

export interface DatabaseError {
  message: string;
  code: string | undefined;
}

export interface DbResult<T> {
  data: T | null;
  error: DatabaseError | null;
}

export interface DbCountResult {
  count: number | null;
  error: DatabaseError | null;
}

// ── Row types (app-level, not tied to generated Supabase types) ─────

export interface ProfileRow {
  id: string;
  full_name: string;
  role: string | null;
  bio: string;
  avatar_url: string;
  updated_at: string;
  social_links: Json;
}

export interface SurveyRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  visibility: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  max_respondents: number | null;
  slug: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  archived_at: string | null;
  previous_status: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface SurveyQuestionRow {
  id: string;
  survey_id: string;
  text: string;
  type: string;
  required: boolean;
  description: string | null;
  config: Json;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SurveyResponseRow {
  id: string;
  survey_id: string;
  status: string;
  feedback: string | null;
  started_at: string;
  completed_at: string | null;
  device_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface SurveyAnswerRow {
  id: string;
  response_id: string;
  question_id: string;
  value: Json;
  created_at: string;
  updated_at: string;
}

// ── Repository interfaces ───────────────────────────────────────────

export interface ProfileRepository {
  findById(id: string): Promise<DbResult<ProfileRow>>;
  update(
    id: string,
    data: Partial<Pick<ProfileRow, 'full_name' | 'role' | 'bio' | 'avatar_url' | 'social_links'>>
  ): Promise<{ error: DatabaseError | null }>;
}

export interface SurveyRepository {
  findById(
    id: string,
    filters?: { userId?: string; status?: string | string[] }
  ): Promise<DbResult<SurveyRow>>;

  findByIdSelect<T extends Record<string, unknown>>(
    id: string,
    columns: string,
    filters?: { userId?: string; status?: string | string[] }
  ): Promise<DbResult<T>>;

  findBySlug(slug: string, statuses: string[], columns?: string): Promise<DbResult<SurveyRow>>;

  insert(data: {
    user_id: string;
    title: string;
    description: string;
    category: string;
    visibility: string;
    status: string;
    max_respondents?: number | null;
  }): Promise<DbResult<{ id: string }>>;

  update(
    id: string,
    data: Record<string, unknown>,
    filters?: { userId?: string; status?: string | string[] }
  ): Promise<DbResult<{ id: string }>>;

  delete(
    id: string,
    filters?: { userId?: string; status?: string | string[] }
  ): Promise<DbResult<{ id: string }>>;

  countByUserId(userId: string, filters?: { status?: string }): Promise<DbCountResult>;
}

export interface SurveyQuestionRepository {
  findBySurveyId(
    surveyId: string,
    columns?: string
  ): Promise<{ data: SurveyQuestionRow[] | null; error: DatabaseError | null }>;

  insert(
    rows: Array<{
      survey_id: string;
      text: string;
      type: string;
      required: boolean;
      description: string | null;
      config: Json;
      sort_order: number;
    }>
  ): Promise<{ error: DatabaseError | null }>;

  countBySurveyId(surveyId: string, filters?: { textNotEmpty?: boolean }): Promise<DbCountResult>;
}

export interface SurveyResponseRepository {
  countBySurveyId(surveyId: string, filters?: { status?: string }): Promise<DbCountResult>;

  deleteBySurveyId(surveyId: string): Promise<{ error: DatabaseError | null }>;

  countByUserSurveys(userId: string, filters?: { status?: string }): Promise<DbCountResult>;
}

export interface SurveyAnswerRepository {
  findByResponseIds(responseIds: string[]): Promise<{
    data: Array<{ response_id: string; question_id: string; value: Json }> | null;
    error: DatabaseError | null;
  }>;
}

// ── Main interface ──────────────────────────────────────────────────

export interface DatabaseClient {
  /** Call a database RPC (stored function). */
  rpc<T = unknown>(functionName: string, args?: Record<string, unknown>): Promise<DbResult<T>>;

  profiles: ProfileRepository;
  surveys: SurveyRepository;
  surveyQuestions: SurveyQuestionRepository;
  surveyResponses: SurveyResponseRepository;
  surveyAnswers: SurveyAnswerRepository;
}
