'use server';

import { z } from 'zod';

import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

const assignSurveyToProjectSchema = z.object({
  surveyId: z.uuid(),
  projectId: z.uuid(),
});

export const assignSurveyToProject = withProtectedAction<typeof assignSurveyToProjectSchema, void>(
  'assign-survey-to-project',
  {
    schema: assignSurveyToProjectSchema,
    rateLimit: RATE_LIMITS.crud,
    action: async ({ data, user, supabase }) => {
      if (data.projectId) {
        const { data: project } = await supabase
          .from('projects')
          .select('id')
          .eq('id', data.projectId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!project) {
          return { error: 'surveys.errors.unexpected' };
        }
      }

      const { data: row, error } = await supabase
        .from('surveys')
        .update({
          project_id: data.projectId,
        })
        .eq('id', data.surveyId)
        .eq('user_id', user.id)
        .select('id')
        .maybeSingle();

      if (error || !row) {
        return { error: 'surveys.errors.unexpected' };
      }

      return { success: true };
    },
  }
);
