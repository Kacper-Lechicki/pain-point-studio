/**
 * Supabase session handling in Next.js middleware. Builds a server client with
 * request cookies, refreshes the auth session (tokens), and returns the response
 * (with any Set-Cookie headers) plus the current user. Import and call from the
 * app middleware (e.g. src/proxy.ts) so every request has an up-to-date session.
 */
import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';

import { env } from '@/lib/common/env';

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
