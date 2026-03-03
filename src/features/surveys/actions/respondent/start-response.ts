'use server';

import { headers } from 'next/headers';

import { createHash } from 'node:crypto';

import { mapRpcError } from '@/features/surveys/config';
import { startResponseSchema } from '@/features/surveys/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withPublicAction } from '@/lib/common/with-public-action';

async function computeFingerprint(): Promise<string | null> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ua = h.get('user-agent');

  if (!ip) {
    return null;
  }

  return createHash('sha256')
    .update(`${ip}:${ua ?? ''}`)
    .digest('hex');
}

export const startResponse = withPublicAction<typeof startResponseSchema, { responseId: string }>(
  'start-response',
  {
    schema: startResponseSchema,
    rateLimit: RATE_LIMITS.respondentStart,
    action: async ({ data, supabase }) => {
      const fingerprint = await computeFingerprint();

      const { data: responseId, error } = await supabase.rpc('start_survey_response', {
        p_survey_id: data.surveyId,
        ...(data.deviceType ? { p_device_type: data.deviceType } : {}),
        ...(fingerprint ? { p_fingerprint: fingerprint } : {}),
      });

      if (error) {
        return { error: `respondent.${mapRpcError(error.message, 'errors.startFailed')}` };
      }

      return { success: true, data: { responseId: responseId as string } };
    },
  }
);
