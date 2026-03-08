'use server';

import { z } from 'zod';

import type { SurveyResponseListItem } from '@/features/surveys/types/response-list';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

const schema = z.object({
  surveyId: z.string().uuid(),
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  status: z.enum(['in_progress', 'completed', 'abandoned']).optional(),
  device: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  hasContact: z.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['completed_at', 'started_at', 'duration']).default('completed_at'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const getSurveyResponses = withProtectedAction<
  typeof schema,
  { items: SurveyResponseListItem[]; totalCount: number }
>('get-survey-responses', {
  schema,
  rateLimit: RATE_LIMITS.crud,
  action: async ({ data, user, supabase }) => {
    const params = {
      p_survey_id: data.surveyId,
      p_user_id: user.id,
      p_page: data.page,
      p_per_page: data.perPage,
      p_sort_by: data.sortBy,
      p_sort_dir: data.sortDir,
      ...(data.status && { p_status: data.status }),
      ...(data.device && { p_device: data.device }),
      ...(data.hasContact != null && { p_has_contact: data.hasContact }),
      ...(data.search && { p_search: data.search }),
      ...(data.dateFrom && { p_date_from: data.dateFrom }),
      ...(data.dateTo && { p_date_to: data.dateTo }),
    };

    const { data: result, error } = await supabase.rpc('get_survey_responses_list', params);

    if (error) {
      return { error: 'surveys.errors.unexpected' };
    }

    const parsed = result as { items: SurveyResponseListItem[]; totalCount: number } | null;

    if (!parsed) {
      return { error: 'surveys.errors.unexpected' };
    }

    return {
      success: true,
      data: {
        items: parsed.items,
        totalCount: parsed.totalCount,
      },
    };
  },
});
