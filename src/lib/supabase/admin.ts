import { createClient } from '@supabase/supabase-js';

import { env } from '@/lib/common/env';
import { Database } from '@/lib/supabase/types';

/**
 * Creates a Supabase admin client using the service role key.
 * Only for server-side operations requiring elevated privileges
 * (e.g., deleting a user account).
 */
export const createAdminClient = () => {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
  }

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};
