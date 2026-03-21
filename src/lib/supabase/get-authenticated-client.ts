import { cache } from 'react';

import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

interface AuthenticatedClient {
  user: User | null;
  supabase: SupabaseClient<Database>;
}

export const getAuthenticatedClient = cache(async (): Promise<AuthenticatedClient> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, supabase };
});
