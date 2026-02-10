import { createBrowserClient } from '@supabase/ssr';

import { env } from '@/lib/common/env';
import { Database } from '@/lib/supabase/types';

export const createClient = () =>
  createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
