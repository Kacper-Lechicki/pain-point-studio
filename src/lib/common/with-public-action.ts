/**
 * HOF for server actions that do not require auth. Applies rate limit and Zod
 * validation, then runs the action with db only. Use for respondent flows,
 * public forms, etc. For authenticated flows use withProtectedAction.
 */
import { ZodType, z } from 'zod';

import { RateLimitConfig, rateLimit } from '@/lib/common/rate-limit';
import { ActionResult } from '@/lib/common/types';
import type { DatabaseClient } from '@/lib/providers/database';
import { createSupabaseDatabaseClient } from '@/lib/supabase/providers/database';
import { createClient } from '@/lib/supabase/server';

interface PublicActionConfig<TSchema extends ZodType, TData = undefined> {
  schema: TSchema;
  rateLimit: Omit<RateLimitConfig, 'key'>;
  rateLimitError?: string;
  validationError?: string;
  action: (params: { data: z.infer<TSchema>; db: DatabaseClient }) => Promise<ActionResult<TData>>;
}

export function withPublicAction<TSchema extends ZodType, TData = undefined>(
  key: string,
  config: PublicActionConfig<TSchema, TData>
) {
  return async (formData: z.infer<TSchema>): Promise<ActionResult<TData>> => {
    const { limited } = await rateLimit({ key, ...config.rateLimit });

    if (limited) {
      return { error: config.rateLimitError ?? 'common.errors.rateLimitExceeded' };
    }

    const validation = config.schema.safeParse(formData);

    if (!validation.success) {
      return { error: config.validationError ?? 'common.errors.invalidData' };
    }

    const supabase = await createClient();
    const db = createSupabaseDatabaseClient(supabase);

    return config.action({ data: validation.data, db });
  };
}
