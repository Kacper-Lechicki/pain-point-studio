import { NextRequest, NextResponse } from 'next/server';

import { ROUTES } from '@/config/routes';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  // Retrieve URL parameters
  const { locale } = await params;
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  if (code) {
    // Exchange auth code for Supabase session
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to destination or dashboard
      const redirectPath = next || `/${locale}${ROUTES.common.dashboard}`;

      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  // Handle error by redirecting to sign in
  const signInUrl = new URL(`/${locale}${ROUTES.auth.signIn}`, request.url);
  signInUrl.searchParams.set('error', 'auth_callback_error');

  return NextResponse.redirect(signInUrl);
}
