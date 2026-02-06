import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';

import { env } from '@/lib/common/env';

/**
 * Updates Supabase session in middleware.
 * Refreshes auth tokens and manages cookie lifecycle.
 * Returns the response with updated cookies and the authenticated user (or null).
 */
export const updateSession = async (
  req: NextRequest
): Promise<{ response: NextResponse; user: User | null }> => {
  let supabaseResponse = NextResponse.next({
    request: req,
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));

          supabaseResponse = NextResponse.next({
            request: req,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user };
};
