import { cookies } from 'next/headers';

import { createServerClient } from '@supabase/ssr';

import { env } from '@/lib/common/env';
import { Database } from '@/lib/supabase/types';

/**
 * Creates a Supabase client for server-side usage.
 * Handles cookie-based session management with Next.js.
 */
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
};
