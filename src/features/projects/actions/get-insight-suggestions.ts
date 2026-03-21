'use server';

import { cache } from 'react';

import { getProjectSignalsData } from '@/features/projects/actions/get-project-signals-data';
import { generateInsightSuggestions } from '@/features/projects/lib/suggestions';
import type { InsightSuggestion } from '@/features/projects/types';
import { getAuthenticatedClient } from '@/lib/supabase/get-authenticated-client';

export interface InsightSuggestionsResult {
  suggestions: InsightSuggestion[];
  totalCompletedResponses: number;
}

const EMPTY_RESULT: InsightSuggestionsResult = {
  suggestions: [],
  totalCompletedResponses: 0,
};

/**
 * Fetch auto-generated insight suggestions for a project.
 * Computes suggestions from survey signal data and filters out
 * any the user has already accepted or dismissed.
 * Wrapped with React `cache()` for per-request deduplication.
 */
export const getInsightSuggestions = cache(
  async (projectId: string): Promise<InsightSuggestionsResult> => {
    const { user, supabase } = await getAuthenticatedClient();

    if (!user) {
      return EMPTY_RESULT;
    }

    // Fetch signal data and acted signatures in parallel
    const [signalsData, actionsResult] = await Promise.all([
      getProjectSignalsData(projectId),
      supabase.from('insight_suggestion_actions').select('signature').eq('project_id', projectId),
    ]);

    const actedSignatures = new Set((actionsResult.data ?? []).map((a) => a.signature));

    const totalCompletedResponses = signalsData.reduce((sum, s) => sum + s.completedResponses, 0);

    const suggestions = generateInsightSuggestions(signalsData, actedSignatures);

    return { suggestions, totalCompletedResponses };
  }
);
