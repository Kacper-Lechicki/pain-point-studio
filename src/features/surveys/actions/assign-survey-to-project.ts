'use server';

import { z } from 'zod';

import { RESEARCH_PHASES } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

const assignSurveyToProjectSchema = z.object({
  surveyId: z.uuid(),
  projectId: z.uuid().nullable(),
  researchPhase: z.enum(RESEARCH_PHASES).nullable().optional(),
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
          .select('id, context')
          .eq('id', data.projectId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!project) {
          return { error: 'surveys.errors.unexpected' };
        }

        if (data.researchPhase && project.context !== 'idea_validation') {
          return { error: 'surveys.errors.unexpected' };
        }
      }

      const { data: row, error } = await supabase
        .from('surveys')
        .update({
          project_id: data.projectId,
          research_phase: data.projectId ? (data.researchPhase ?? null) : null,
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
