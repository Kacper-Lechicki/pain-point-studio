'use server';

import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

export interface PendingInsightSurvey {
  id: string;
  title: string;
  status: string;
  completedAt: string | null;
  cancelledAt: string | null;
  totalResponses: number;
}

/**
 * Fetch completed/cancelled surveys that the user hasn't yet decided
 * whether to include in project insights (generate_insights IS NULL).
 * Wrapped with React `cache()` for per-request deduplication.
 */
export const getPendingInsightSurveys = cache(
  async (projectId: string): Promise<PendingInsightSurvey[]> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data: surveys, error } = await supabase
      .from('surveys')
      .select('id, title, status, completed_at, cancelled_at')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .in('status', ['completed', 'cancelled'])
      .is('generate_insights', null)
      .order('completed_at', { ascending: false, nullsFirst: false });

    if (error || !surveys) {
      return [];
    }

    if (surveys.length === 0) {
      return [];
    }

    // Fetch response counts for these surveys
    const surveyIds = surveys.map((s) => s.id);

    const { data: responses } = await supabase
      .from('survey_responses')
      .select('survey_id')
      .in('survey_id', surveyIds);

    const countBySurvey = new Map<string, number>();

    for (const r of responses ?? []) {
      countBySurvey.set(r.survey_id, (countBySurvey.get(r.survey_id) ?? 0) + 1);
    }

    return surveys.map((s) => ({
      id: s.id,
      title: s.title,
      status: s.status,
      completedAt: s.completed_at,
      cancelledAt: s.cancelled_at,
      totalResponses: countBySurvey.get(s.id) ?? 0,
    }));
  }
);
