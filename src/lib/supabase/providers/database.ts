/**
 * Supabase implementation of the DatabaseClient interface.
 * Wraps PostgREST queries and RPC calls.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  DatabaseClient,
  DatabaseError,
  ProfileRepository,
  SurveyAnswerRepository,
  SurveyQuestionRepository,
  SurveyRepository,
  SurveyResponseRepository,
} from '@/lib/providers/database';

import type { Database } from '../types';

// ── Helper ──────────────────────────────────────────────────────────

function mapError(error: { message: string; code?: string } | null): DatabaseError | null {
  return error ? { message: error.message, code: error.code } : null;
}

// ── Profiles ────────────────────────────────────────────────────────

function createProfileRepository(supabase: SupabaseClient<Database>): ProfileRepository {
  return {
    async findById(id) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();

      return { data, error: mapError(error) };
    },

    async update(id, data) {
      const { error } = await supabase.from('profiles').update(data).eq('id', id);

      return { error: mapError(error) };
    },

    async upsert(id, data) {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id, ...data } as never, { onConflict: 'id' });

      return { error: mapError(error) };
    },
  };
}

// ── Surveys ─────────────────────────────────────────────────────────

function createSurveyRepository(supabase: SupabaseClient<Database>): SurveyRepository {
  return {
    async findById(id, filters) {
      let query = supabase.from('surveys').select('*').eq('id', id);

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.status) {
        query = Array.isArray(filters.status)
          ? query.in('status', filters.status as never)
          : query.eq('status', filters.status as never);
      }

      const { data, error } = await query.maybeSingle();

      return { data, error: mapError(error) };
    },

    async findByIdSelect(id, columns, filters) {
      let query = supabase.from('surveys').select(columns).eq('id', id);

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.status) {
        query = Array.isArray(filters.status)
          ? query.in('status', filters.status as never)
          : query.eq('status', filters.status as never);
      }

      const { data, error } = await query.maybeSingle();

      return { data: data as never, error: mapError(error) };
    },

    async findBySlug(slug, statuses, columns) {
      const { data, error } = await supabase
        .from('surveys')
        .select(columns ?? '*')
        .eq('slug', slug)
        .in('status', statuses as never)
        .single();

      return { data: data as never, error: mapError(error) };
    },

    async insert(data) {
      const { data: row, error } = await supabase
        .from('surveys')
        .insert(data as never)
        .select('id')
        .single();

      return { data: row, error: mapError(error) };
    },

    async update(id, data, filters) {
      let query = supabase
        .from('surveys')
        .update(data as never)
        .eq('id', id);

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.status) {
        query = Array.isArray(filters.status)
          ? query.in('status', filters.status as never)
          : query.eq('status', filters.status as never);
      }

      const { data: row, error } = await query.select('id').maybeSingle();

      return { data: row, error: mapError(error) };
    },

    async delete(id, filters) {
      let query = supabase.from('surveys').delete().eq('id', id);

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.status) {
        query = Array.isArray(filters.status)
          ? query.in('status', filters.status as never)
          : query.eq('status', filters.status as never);
      }

      const { data: row, error } = await query.select('id').maybeSingle();

      return { data: row, error: mapError(error) };
    },

    async countByUserId(userId, filters) {
      let query = supabase
        .from('surveys')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (filters?.status) {
        query = query.eq('status', filters.status as never);
      }

      const { count, error } = await query;

      return { count, error: mapError(error) };
    },
  };
}

// ── Survey Questions ────────────────────────────────────────────────

function createSurveyQuestionRepository(
  supabase: SupabaseClient<Database>
): SurveyQuestionRepository {
  return {
    async findBySurveyId(surveyId, columns) {
      const { data, error } = await supabase
        .from('survey_questions')
        .select(columns ?? '*')
        .eq('survey_id', surveyId)
        .order('sort_order');

      return { data: data as never, error: mapError(error) };
    },

    async insert(rows) {
      const { error } = await supabase.from('survey_questions').insert(rows as never);

      return { error: mapError(error) };
    },

    async countBySurveyId(surveyId, filters) {
      let query = supabase
        .from('survey_questions')
        .select('id', { count: 'exact', head: true })
        .eq('survey_id', surveyId);

      if (filters?.textNotEmpty) {
        query = query.neq('text', '');
      }

      const { count, error } = await query;

      return { count, error: mapError(error) };
    },
  };
}

// ── Survey Responses ────────────────────────────────────────────────

function createSurveyResponseRepository(
  supabase: SupabaseClient<Database>
): SurveyResponseRepository {
  return {
    async countBySurveyId(surveyId, filters) {
      let query = supabase
        .from('survey_responses')
        .select('*', { count: 'exact', head: true })
        .eq('survey_id', surveyId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { count, error } = await query;

      return { count, error: mapError(error) };
    },

    async deleteBySurveyId(surveyId) {
      const { error } = await supabase.from('survey_responses').delete().eq('survey_id', surveyId);

      return { error: mapError(error) };
    },

    async countByUserSurveys(userId, filters) {
      let query = supabase
        .from('survey_responses')
        .select('*, surveys!inner(*)', { count: 'exact', head: true })
        .eq('surveys.user_id', userId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { count, error } = await query;

      return { count, error: mapError(error) };
    },
  };
}

// ── Survey Answers ──────────────────────────────────────────────────

function createSurveyAnswerRepository(supabase: SupabaseClient<Database>): SurveyAnswerRepository {
  return {
    async findByResponseIds(responseIds) {
      const { data, error } = await supabase
        .from('survey_answers')
        .select('response_id, question_id, value')
        .in('response_id', responseIds);

      return { data, error: mapError(error) };
    },
  };
}

// ── Main factory ────────────────────────────────────────────────────

export function createSupabaseDatabaseClient(supabase: SupabaseClient<Database>): DatabaseClient {
  return {
    async rpc<T = unknown>(functionName: string, args?: Record<string, unknown>) {
      const { data, error } = await supabase.rpc(functionName as never, args as never);

      return { data: data as T | null, error: mapError(error) };
    },

    profiles: createProfileRepository(supabase),
    surveys: createSurveyRepository(supabase),
    surveyQuestions: createSurveyQuestionRepository(supabase),
    surveyResponses: createSurveyResponseRepository(supabase),
    surveyAnswers: createSurveyAnswerRepository(supabase),
  };
}
