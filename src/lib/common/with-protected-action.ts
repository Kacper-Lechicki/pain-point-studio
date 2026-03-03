/**
 * HOF for server actions that require an authenticated user. Applies rate limit,
 * Zod validation, then auth; only then runs the action with user + supabase client.
 * Use for dashboard/settings flows. For unauthenticated flows use withPublicAction.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { ZodType, z } from 'zod';

import { RateLimitConfig, rateLimit } from '@/lib/common/rate-limit';
import { ActionResult, ERRORS } from '@/lib/common/types';
import type { AppUser } from '@/lib/supabase/helpers';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import { mapSupabaseUser } from '@/lib/supabase/user-mapper';

interface ProtectedActionConfig<TSchema extends ZodType, TData = undefined> {
  schema: TSchema;
  rateLimit: Omit<RateLimitConfig, 'key'>;
  rateLimitError?: string;
  validationError?: string;
  action: (params: {
    data: z.infer<TSchema>;
    user: AppUser;
    supabase: SupabaseClient<Database>;
  }) => Promise<ActionResult<TData>>;
}

export function withProtectedAction<TSchema extends ZodType, TData = undefined>(
  key: string,
  config: ProtectedActionConfig<TSchema, TData>
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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: ERRORS.authRequired };
    }

    try {
      return await config.action({ data: validation.data, user: mapSupabaseUser(user), supabase });
    } catch {
      return { error: ERRORS.unexpected };
    }
  };
}
