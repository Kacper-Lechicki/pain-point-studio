/**
 * HOF for server actions that require an authenticated user. Applies rate limit,
 * Zod validation, then auth; only then runs the action with user + providers.
 * Use for dashboard/settings flows. For unauthenticated flows use withPublicAction.
 */
import { ZodType, z } from 'zod';

import { RateLimitConfig, rateLimit } from '@/lib/common/rate-limit';
import { ActionResult } from '@/lib/common/types';
import type { AuthProvider } from '@/lib/providers/auth';
import type { DatabaseClient } from '@/lib/providers/database';
import type { StorageProvider } from '@/lib/providers/storage';
import type { AppUser } from '@/lib/providers/types';
import { createServerAuthProvider } from '@/lib/supabase/providers/auth.server';
import { createSupabaseDatabaseClient } from '@/lib/supabase/providers/database';
import { createServerStorageProvider } from '@/lib/supabase/providers/storage.server';
import { createClient } from '@/lib/supabase/server';

interface ProtectedActionConfig<TSchema extends ZodType, TData = undefined> {
  schema: TSchema;
  rateLimit: Omit<RateLimitConfig, 'key'>;
  rateLimitError?: string;
  validationError?: string;
  action: (params: {
    data: z.infer<TSchema>;
    user: AppUser;
    auth: AuthProvider;
    db: DatabaseClient;
    storage: StorageProvider;
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
    const auth = createServerAuthProvider(supabase);
    const db = createSupabaseDatabaseClient(supabase);
    const storage = createServerStorageProvider(supabase);

    const { data: userData, error: authError } = await auth.getUser();

    if (authError || !userData?.user) {
      return { error: 'settings.errors.unexpected' };
    }

    return config.action({ data: validation.data, user: userData.user, auth, db, storage });
  };
}
