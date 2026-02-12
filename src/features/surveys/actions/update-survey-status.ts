'use server';

import { withProtectedAction } from '@/lib/common/with-protected-action';

import { type SurveyStatus, surveyIdSchema } from '../types';

interface StatusTransition {
  method: 'update' | 'delete';
  toStatus?: SurveyStatus;
  fromStatuses: SurveyStatus[];
}

const TRANSITIONS = {
  close: { method: 'update', toStatus: 'closed', fromStatuses: ['active'] },
  reopen: { method: 'update', toStatus: 'active', fromStatuses: ['closed'] },
  archive: { method: 'update', toStatus: 'archived', fromStatuses: ['active', 'closed'] },
  delete: { method: 'delete', fromStatuses: ['draft'] },
} as const satisfies Record<string, StatusTransition>;

type SurveyAction = keyof typeof TRANSITIONS;

function createStatusAction(action: SurveyAction) {
  const transition = TRANSITIONS[action];

  return withProtectedAction<typeof surveyIdSchema, void>(`${action}-survey`, {
    schema: surveyIdSchema,
    rateLimit: { limit: 10, windowSeconds: 300 },
    action: async ({ data, user, supabase }) => {
      const applyFilters = (query: ReturnType<typeof supabase.from>) => {
        let q = query.eq('id', data.surveyId).eq('user_id', user.id);

        if (transition.fromStatuses.length === 1) {
          q = q.eq('status', transition.fromStatuses[0]);
        } else {
          q = q.in('status', [...transition.fromStatuses]);
        }

        return q;
      };

      const { data: row, error } =
        transition.method === 'delete'
          ? await applyFilters(supabase.from('surveys')).delete().select('id').maybeSingle()
          : await applyFilters(supabase.from('surveys'))
              .update({ status: transition.toStatus! })
              .select('id')
              .maybeSingle();

      if (error || !row) {
        return { error: 'surveys.errors.unexpected' };
      }

      return { success: true };
    },
  });
}

export const closeSurvey = createStatusAction('close');
export const reopenSurvey = createStatusAction('reopen');
export const archiveSurvey = createStatusAction('archive');
export const deleteSurveyDraft = createStatusAction('delete');
