/**
 * Supabase client for the browser. Uses the anon key and cookie-based session;
 * RLS applies. Use in client components only. For server-side code use
 * createClient from @/lib/supabase/server.
 */
import { createBrowserClient } from '@supabase/ssr';

import { env } from '@/lib/common/env';
import { Database } from '@/lib/supabase/types';

export const createClient = () =>
  createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
