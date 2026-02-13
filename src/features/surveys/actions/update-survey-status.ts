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
  restore: { method: 'update', toStatus: 'closed', fromStatuses: ['archived'] },
  delete: { method: 'delete', fromStatuses: ['draft'] },
} as const satisfies Record<string, StatusTransition>;

type SurveyAction = keyof typeof TRANSITIONS;

function createStatusAction(action: SurveyAction) {
  const transition = TRANSITIONS[action];

  return withProtectedAction<typeof surveyIdSchema, void>(`${action}-survey`, {
    schema: surveyIdSchema,
    rateLimit: { limit: 10, windowSeconds: 300 },
    action: async ({ data, user, supabase }) => {
      const { data: row, error } =
        transition.method === 'delete'
          ? await (
              transition.fromStatuses.length === 1
                ? supabase
                    .from('surveys')
                    .delete()
                    .eq('id', data.surveyId)
                    .eq('user_id', user.id)
                    .eq('status', transition.fromStatuses[0])
                : supabase
                    .from('surveys')
                    .delete()
                    .eq('id', data.surveyId)
                    .eq('user_id', user.id)
                    .in('status', [...transition.fromStatuses])
            )
              .select('id')
              .maybeSingle()
          : await (
              transition.fromStatuses.length === 1
                ? supabase
                    .from('surveys')
                    .update({ status: transition.toStatus! })
                    .eq('id', data.surveyId)
                    .eq('user_id', user.id)
                    .eq('status', transition.fromStatuses[0])
                : supabase
                    .from('surveys')
                    .update({ status: transition.toStatus! })
                    .eq('id', data.surveyId)
                    .eq('user_id', user.id)
                    .in('status', [...transition.fromStatuses])
            )
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
export const restoreSurvey = createStatusAction('restore');
export const deleteSurveyDraft = createStatusAction('delete');
