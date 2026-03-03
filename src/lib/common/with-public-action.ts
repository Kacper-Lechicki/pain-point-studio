/**
 * HOF for server actions that do not require auth. Applies rate limit and Zod
 * validation, then runs the action with supabase client only. Use for respondent
 * flows, public forms, etc. For authenticated flows use withProtectedAction.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { ZodType, z } from 'zod';

import { RateLimitConfig, rateLimit } from '@/lib/common/rate-limit';
import { ActionResult, ERRORS } from '@/lib/common/types';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

interface PublicActionConfig<TSchema extends ZodType, TData = undefined> {
  schema: TSchema;
  rateLimit: Omit<RateLimitConfig, 'key'>;
  rateLimitError?: string;
  validationError?: string;
  action: (params: {
    data: z.infer<TSchema>;
    supabase: SupabaseClient<Database>;
  }) => Promise<ActionResult<TData>>;
}

export function withPublicAction<TSchema extends ZodType, TData = undefined>(
  key: string,
  config: PublicActionConfig<TSchema, TData>
) {
  return async (formData: z.infer<TSchema>): Promise<ActionResult<TData>> => {
    const { limited } = await rateLimit({ key, ...config.rateLimit });

    if (limited) {
      return { error: config.rateLimitError ?? ERRORS.rateLimitExceeded };
    }

    const validation = config.schema.safeParse(formData);

    if (!validation.success) {
      return { error: config.validationError ?? ERRORS.invalidData };
    }

    const supabase = await createClient();

    try {
      return await config.action({ data: validation.data, supabase });
    } catch {
      return { error: ERRORS.unexpected };
    }
  };
}
