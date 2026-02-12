import { NextRequest, NextResponse } from 'next/server';

import { ROUTES } from '@/config';
import { createClient } from '@/lib/supabase/server';

function getSafeRedirectPath(next: string | null, fallback: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return fallback;
  }

  return next;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');
  const type = requestUrl.searchParams.get('type');

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', data.user.id)
          .single();

        if (profile?.avatar_url && profile.avatar_url !== data.user.user_metadata?.avatar_url) {
          await supabase.auth.updateUser({
            data: { avatar_url: profile.avatar_url },
          });
        }
      }

      const fallbackPath = `/${locale}${ROUTES.common.dashboard}`;
      const redirectPath = getSafeRedirectPath(next, fallbackPath);

      const redirectUrl = new URL(redirectPath, request.url);

      if (redirectPath === fallbackPath || type === 'email_change') {
        const toastKey =
          type === 'signup'
            ? 'emailConfirmed'
            : type === 'email_change'
              ? 'emailChangeConfirmed'
              : 'signInSuccess';

        redirectUrl.searchParams.set('toast', toastKey);
      }

      return NextResponse.redirect(redirectUrl);
    }
  }

  const signInUrl = new URL(`/${locale}${ROUTES.auth.signIn}`, request.url);

  signInUrl.searchParams.set('error', 'auth_callback_error');

  return NextResponse.redirect(signInUrl);
}
