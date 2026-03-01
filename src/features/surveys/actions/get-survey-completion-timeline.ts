'use server';

import { cache } from 'react';

import { z } from 'zod';

import type { CompletionTimelinePoint } from '@/features/projects/types';
import { createClient } from '@/lib/supabase/server';

const completionTimelinePointSchema = z.object({
  date: z.string(),
  completed: z.number(),
  inProgress: z.number(),
  abandoned: z.number(),
});

const completionTimelineSchema = z.array(completionTimelinePointSchema);

/**
 * Fetches completion timeline (3 series per day) for a survey.
 * Returns empty array when unauthenticated, not found, or on error.
 */
export const getSurveyCompletionTimeline = cache(
  async (surveyId: string): Promise<CompletionTimelinePoint[]> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase.rpc('get_survey_completion_timeline', {
      p_survey_id: surveyId,
      p_user_id: user.id,
    });

    if (error || data == null) {
      return [];
    }

    const parsed = completionTimelineSchema.safeParse(data);

    return parsed.success ? parsed.data : [];
  }
);
