import { NextRequest, NextResponse } from 'next/server';

import { ROUTES } from '@/config';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const redirectPath = next || `/${locale}${ROUTES.common.dashboard}`;

      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  const signInUrl = new URL(`/${locale}${ROUTES.auth.signIn}`, request.url);

  signInUrl.searchParams.set('error', 'auth_callback_error');

  return NextResponse.redirect(signInUrl);
}
