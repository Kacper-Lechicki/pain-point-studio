import { ZodType, z } from 'zod';

import { RateLimitConfig, rateLimit } from '@/lib/common/rate-limit';
import { ActionResult } from '@/lib/common/types';
import { createClient } from '@/lib/supabase/server';

interface PublicActionConfig<TSchema extends ZodType, TData = undefined> {
  schema: TSchema;
  rateLimit: Omit<RateLimitConfig, 'key'>;
  rateLimitError?: string;
  validationError?: string;
  action: (params: {
    data: z.infer<TSchema>;
    supabase: Awaited<ReturnType<typeof createClient>>;
  }) => Promise<ActionResult<TData>>;
}

export function withPublicAction<TSchema extends ZodType, TData = undefined>(
  key: string,
  config: PublicActionConfig<TSchema, TData>
) {
  return async (formData: z.infer<TSchema>): Promise<ActionResult<TData>> => {
    const { limited } = await rateLimit({
      key,
      limit: config.rateLimit.limit,
      windowSeconds: config.rateLimit.windowSeconds,
    });

    if (limited) {
      return { error: config.rateLimitError ?? 'common.errors.rateLimitExceeded' };
    }

    const validation = config.schema.safeParse(formData);

    if (!validation.success) {
      return { error: config.validationError ?? 'common.errors.invalidData' };
    }

    const supabase = await createClient();

    return config.action({ data: validation.data, supabase });
  };
}
