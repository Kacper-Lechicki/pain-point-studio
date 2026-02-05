import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';

import { env } from '@/lib/common/env';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
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

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const pathSegments = requestUrl.pathname.split('/');
      const locale = pathSegments[1];
      const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);

      return NextResponse.redirect(dashboardUrl);
    }
  }

  const pathSegments = requestUrl.pathname.split('/');
  const locale = pathSegments[1];
  const signInUrl = new URL(`/${locale}/sign-in`, request.url);

  signInUrl.searchParams.set('error', 'auth_callback_error');

  return NextResponse.redirect(signInUrl);
}
