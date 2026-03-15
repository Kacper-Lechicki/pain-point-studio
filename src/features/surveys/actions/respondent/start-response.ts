'use server';

import { cookies, headers } from 'next/headers';

import { createHash } from 'node:crypto';

import { mapRpcError } from '@/features/surveys/config';
import { startResponseSchema } from '@/features/surveys/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withPublicAction } from '@/lib/common/with-public-action';

const FINGERPRINT_COOKIE = '__fp';

async function computeFingerprint(): Promise<string | null> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ua = h.get('user-agent');
  const acceptLang = h.get('accept-language');
  const acceptEnc = h.get('accept-encoding');

  if (ip) {
    return createHash('sha256')
      .update(`${ip}:${ua ?? ''}:${acceptLang ?? ''}:${acceptEnc ?? ''}`)
      .digest('hex');
  }

  const cookieStore = await cookies();
  const existingFp = cookieStore.get(FINGERPRINT_COOKIE)?.value;

  if (existingFp) {
    return existingFp;
  }

  const randomFp = createHash('sha256')
    .update(`${Date.now()}:${Math.random()}:${ua ?? ''}`)
    .digest('hex');

  cookieStore.set(FINGERPRINT_COOKIE, randomFp, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });

  return randomFp;
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
