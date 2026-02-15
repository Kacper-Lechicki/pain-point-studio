/**
 * HOF for server actions that require an authenticated user. Applies rate limit,
 * Zod validation, then Supabase auth; only then runs the action with user + supabase.
 * Use for dashboard/settings flows. For unauthenticated flows use withPublicAction.
 */
import { User } from '@supabase/supabase-js';
import { ZodType, z } from 'zod';

import { RateLimitConfig, rateLimit } from '@/lib/common/rate-limit';
import { ActionResult } from '@/lib/common/types';
import { createClient } from '@/lib/supabase/server';

interface ProtectedActionConfig<TSchema extends ZodType, TData = undefined> {
  schema: TSchema;
  rateLimit: Omit<RateLimitConfig, 'key'>;
  rateLimitError?: string;
  validationError?: string;
  action: (params: {
    data: z.infer<TSchema>;
    user: User;
    supabase: Awaited<ReturnType<typeof createClient>>;
  }) => Promise<ActionResult<TData>>;
}

export function withProtectedAction<TSchema extends ZodType, TData = undefined>(
  key: string,
  config: ProtectedActionConfig<TSchema, TData>
) {
  return async (formData: z.infer<TSchema>): Promise<ActionResult<TData>> => {
    const { limited } = await rateLimit({ key, ...config.rateLimit });

    if (limited) {
      return { error: config.rateLimitError ?? 'settings.errors.rateLimitExceeded' };
    }

    const validation = config.schema.safeParse(formData);

    if (!validation.success) {
      return { error: config.validationError ?? 'settings.errors.invalidData' };
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'settings.errors.unexpected' };
    }

    return config.action({ data: validation.data, user, supabase });
  };
}
